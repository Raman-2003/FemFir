
const Sale = require('../models/saleSchema');
const moment = require('moment');
const pdf = require('pdfkit');
const excel = require('node-excel-export');
const User = require('../models/userSchema');
const Address = require('../models/addressSchema');
const Product = require('../models/productSchema');
 
 
exports.getReportPage = (req, res) => {
  res.render('admin/reportForm', { layout: 'adminLayout'});
};

exports.generateReport = async (req, res) => {
  const { startDate, endDate, reportType } = req.body;
  const query = buildQuery(reportType, startDate, endDate);

  try {
      // Fetch sales and populate user and address details
      const sales = await Sale.find(query)
          .populate('user', 'firstname lastname email') // Populate user details
          .populate('address') // Populate address details
          .populate('product'); // Populate product details

      // Update the sales count
      const overallSalesCount = await Sale.countDocuments({ status: 'Delivered' });

      
      res.render('admin/report', { sales, reportType, startDate, endDate, overallSalesCount, layout: 'adminLayout' });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
};

exports.generatePDF = async (req, res) => {
  const { reportType, startDate, endDate } = req.query;
  const query = buildQuery(reportType, startDate, endDate);

  try {
      // Fetch sales and populate user and address details
      const sales = await Sale.find(query)
          .populate({path:'product', select:'name mrp',}) // Populate product details
          .populate('user', 'firstname lastname email') // Populate user details
          .populate('address') // Populate address details
         
      const doc = new pdf();
      let fileName = `Sales_Report_${reportType}_${Date.now()}.pdf`;
      res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-type', 'application/pdf');
      doc.pipe(res);

      // Add styling to the PDF
      doc.font('Helvetica-Bold').fontSize(20).text('Sales Report', { align: 'center' });
      doc.moveDown();

      sales.forEach(sale => {
        const product = sale.product || {}; // Handle case where product might be null or undefined
        const mrp = product.mrp !== undefined? `${product.mrp}` : 'N/A'; // Provide default value for MRP
        const discountedPrice = (product.mrp !== undefined && sale.price !== undefined) ? `${(sale.totalPrice * 10/100).toFixed(2)}` : 'N/A';
        console.log("DISCOUNT : ",discountedPrice);

        
          doc.font('Helvetica-Bold').fontSize(12).text(`Product: ${sale.productName || 'Unknown'}`);
          doc.font('Helvetica').text(`Quantity: ${sale.quantity}`);
          doc.text(`Price: $${sale.price}`);
          doc.text(`MRP: $${mrp}`);
          doc.text(`Coupon discount : $${discountedPrice}`); 
          doc.text(`Total Price: $${sale.totalPrice}`);
          doc.text(`Date: ${moment(sale.saleDate).format('YYYY-MM-DD HH:mm:ss')}`);
          
         if(sale.product){
            doc.text(`MRPPP..: ${sale.product.mrp}`);
            console.log(sale.product);
         }

          if (sale.user) {
              doc.text(`Customer: ${sale.user.firstname} ${sale.user.lastname}`);
              doc.text(`Email: ${sale.user.email}`);
          }

          if (sale.address) {
              doc.text(`Address: ${sale.address.name}, ${sale.address.addressLine1}, ${sale.address.locality}, ${sale.address.city}, ${sale.address.state}, ${sale.address.pin}`);
          }

          doc.moveDown();
      });

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
      // Fetch sales and populate user and address details
      const sales = await Sale.find(query)
          .populate('user', 'firstname lastname email') // Populate user details
          .populate('address') // Populate address details
          .populate('product'); // Populate product details

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
          mrp: { displayName: 'MRP', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 100 }, // Add MRP
          discountedPrice: { displayName: 'Discounted Price', headerStyle: styles.headerDark, cellStyle: styles.cellNormal, width: 150 }, // Add Discounted Price
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
          mrp: sale.product.mrp, // Add MRP
          discountedPrice: sale.product.mrp - sale.price, // Calculate and add Discounted Price
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
  