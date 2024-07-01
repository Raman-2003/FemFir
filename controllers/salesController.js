
const Sale = require('../models/saleSchema');
const moment = require('moment');
const pdf = require('pdfkit');
const excel = require('node-excel-export');
const User = require('../models/userSchema');
const Address = require('../models/addressSchema');
const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const PDFDocument = require('pdfkit-table'); 

 
exports.getReportPage = (req, res) => {
  res.render('admin/reportForm', { layout: 'adminLayout'});
};

exports.generateReport = async (req, res) => {
    const { startDate, endDate, reportType } = req.body;
    const query = buildQuery(reportType, startDate, endDate);
  
    try {
      const sales = await Sale.find(query)
        .populate('user', 'firstname lastname email')
        .populate('address')
        .populate('product');
  
      const overallSalesCount = await Sale.countDocuments({ status: 'Delivered' });
  
      const formattedSales = await Promise.all(sales.map(async (sale) => {
        const product = await Product.findById(sale.product).populate('category');
        let finalPrice = product.price;
        let discount = 0;
  
        if (product.offer && product.offer.discountPercentage > 0) {
          discount = product.price * (product.offer.discountPercentage / 100);
          finalPrice = product.price - discount;
        } else if (product.category && product.category.offer && product.category.offer.discountPercentage > 0) {
          discount = product.price * (product.category.offer.discountPercentage / 100);
          finalPrice = product.price - discount;
        }
  
        return { 
          ...sale._doc,
          finalPrice: finalPrice.toFixed(0),
          discount: discount.toFixed(0)
        };
      }));
  
      res.render('admin/report', { sales: formattedSales, reportType, startDate, endDate, overallSalesCount, layout: 'adminLayout' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  };

exports.generatePDF = async (req, res) => { 
    const { reportType, startDate, endDate } = req.query;
    const query = buildQuery(reportType, startDate, endDate);

    try {
        const sales = await Sale.find(query)
            .populate({ path: 'product', select: 'name mrp' })
            .populate('user', 'firstname lastname email')
            .populate('address');

        const doc = new PDFDocument({ size: 'A3', layout: 'landscape', margin: 30 }); // we can set landscape orientation
        let fileName = `Sales_Report_${reportType}_${Date.now()}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        // Document title
        doc.font('Helvetica-Bold').fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown(2);

        
        const tableHeaders = [
            { label: "Product", property: 'product', width: 100, renderer: (value, indexColumn, indexRow, row, rectRow, rectCell) => {
                return row.product ? row.product.name : 'Unknown';
            }},
            { label: "Quantity", property: 'quantity', width: 50, align: 'center' },
            { label: "Price", property: 'price', width: 60, align: 'center' },
            { label: "MRP ", property: 'mrp', width: 60, align: 'center' },
            { label: "Discount", property: 'discount', width: 60, align: 'center' }, 
            { label: "Total Price", property: 'totalPrice', width: 70, align: 'center' },
            { label: "Date", property: 'date', width: 100, align: 'center' },
            { label: "Customer", property: 'customer', width: 100 },
            { label: "Email", property: 'email', width: 120 },
            { label: "Address", property: 'address', width: 200 } 
        ];

        const tableRows = sales.map(sale => ({
            product: sale.product,
            quantity: sale.quantity,
            price: sale.price,
            mrp: sale.product ? sale.product.mrp : 'N/A',
            discount: (sale.product && sale.price) ? (sale.totalPrice * 10 / 100).toFixed(0) : 'N/A',
            totalPrice: sale.totalPrice,
            date: moment(sale.saleDate).format('YYYY-MM-DD HH:mm:ss'),
            customer: sale.user ? `${sale.user.firstname} ${sale.user.lastname}` : 'N/A',
            email: sale.user ? sale.user.email : 'N/A',
            address: sale.address ? `${sale.address.name}, ${sale.address.addressLine1}, ${sale.address.locality}, ${sale.address.city}, ${sale.address.state}, ${sale.address.pin}` : 'N/A'
        }));

        
        const tableWidth = tableHeaders.reduce((sum, header) => sum + header.width, 0) + (tableHeaders.length - 1) * 5; 

        
        const startX = (doc.page.width - tableWidth) / 2;

        
        const tableOptions = {
            headers: tableHeaders,
            datas: tableRows,
            options: {
                columnSpacing: 5, 
                padding: 5,
                x: startX, 
                width: tableWidth, 
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
                prepareRow: (row, i) => doc.font('Helvetica').fontSize(8),
                rowHeight: 20, 
                columnSpacing: 20,
                headerHeight: 25 
            }
        };

        
        await doc.table(tableOptions);

        doc.end();
    } catch (err) {
        console.error('Error generating PDF:', err.message);
        res.status(500).send('Server Error');
    }
};


exports.generateExcel = async (req, res) => {
  const { reportType, startDate, endDate } = req.query;
  const query = buildQuery(reportType, startDate, endDate);

  try {
      
      const sales = await Sale.find(query)
          .populate('user', 'firstname lastname email')
          .populate('address') 
          .populate('product'); 

      const styles = {
          headerDark: {
              fill: { fgColor: { rgb: 'FF000000' } },
              font: { color: { rgb: 'FFFFFFFF' }, sz: 14, bold: true }
          },
          cellNormal: {
              fill: { fgColor: { rgb: 'FFFFFFFF' } },
              font: { color: { rgb: 'FF000000' }, sz: 12 }
          }
      };

      const specification = {
          productName: { displayName: 'Product Name', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 120 },
          quantity: { displayName: 'Quantity', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 100 },
          price: { displayName: 'Price', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 100 },
          mrp: { displayName: 'MRP', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 100 }, 
          discountedPrice: { displayName: 'Discounted Price', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 150 }, 
          totalPrice: { displayName: 'Total Price', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 100 },
          saleDate: { displayName: 'Sale Date', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 150 },
          customerName: { displayName: 'Customer Name', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 150 },
          customerEmail: { displayName: 'Customer Email', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 200 },
          address: { displayName: 'Address', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 300 }
      };

      const dataset = sales.map(sale => ({
          productName: sale.productName,
          quantity: sale.quantity,
          price: sale.price,
          mrp: sale.product.mrp, 
          discountedPrice: sale.product.mrp - sale.price, 
          totalPrice: sale.totalPrice,
          saleDate: moment(sale.saleDate).format('YYYY-MM-DD HH:mm:ss'),
          customerName: sale.user ? `${sale.user.firstname} ${sale.user.lastname}` : '',
          customerEmail: sale.user ? sale.user.email : '',
          address: sale.address ? `${sale.address.name}, ${sale.address.addressLine1}, ${sale.address.locality}, ${sale.address.city}, ${sale.address.state}, ${sale.address.pin}` : ''
      }));

      const report = excel.buildExport([
          {
              name: 'Sales Report',
              specification,
              data: dataset
          }
      ]);

      res.attachment(`Sales_Report_${reportType}_${Date.now()}.xlsx`);
      return res.send(report);
  } catch (err) {
      res.status(500).send('Server Error');
  }
  };

  function buildQuery(reportType, startDate, endDate) {
    let query = { status: 'Delivered' };
    console.log(query); 
    if (reportType === 'daily') {
        query.saleDate = {
            $gte: moment().startOf('day').toDate(),
            $lt: moment().endOf('day').toDate()
        };
    } else if (reportType === 'weekly') {
        query.saleDate = {
            $gte: moment().startOf('week').toDate(),
            $lt: moment().endOf('week').toDate()
        };
    } else if (reportType === 'monthly') {
        query.saleDate = {
            $gte: moment().startOf('month').toDate(),
            $lt: moment().endOf('month').toDate()
        };
    } else if (reportType === 'custom') {
        query.saleDate = {
            $gte: new Date(startDate),
            $lt: new Date(endDate)
        };
    }
    return query;
};

exports.getSalesCount = async (req, res) => {
    try {
      const overallSalesCount = await Sale.countDocuments({ status: 'Delivered' });
      res.json({ overallSalesCount });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  };
  