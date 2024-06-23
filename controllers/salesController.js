

const Sale = require('../models/saleSchema');
const moment = require('moment');
const pdf = require('pdfkit');
const excel = require('node-excel-export');
const Order = require('../models/orderSchema')

exports.getReportPage = (req, res) => {
  res.render('admin/reportForm', { layout: 'adminLayout'});
};

exports.generateReport = async (req, res) => {
    const { startDate, endDate, reportType } = req.body;
    const query = buildQuery(reportType, startDate, endDate);
  
    try {
      const sales = await Sale.find(query);
      console.log(sales); 
      res.render('admin/report', { sales, reportType, startDate, endDate, layout: 'adminLayout' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
};

  exports.generatePDF = async (req, res) => {
    const { reportType, startDate, endDate } = req.query;
    const query = buildQuery(reportType, startDate, endDate);
  
    try {
      const sales = await Sale.find(query);
      const doc = new pdf();
      let fileName = `Sales_Report_${reportType}_${Date.now()}.pdf`;
      res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
      res.setHeader('Content-type', 'application/pdf');
      doc.pipe(res);
  
      doc.text('Sales Report', { align: 'center' });
      doc.moveDown();
      sales.forEach(sale => {
        doc.text(`Product: ${sale.productName}`);
        doc.text(`Quantity: ${sale.quantity}`);
        doc.text(`Price: $${sale.price}`);
        doc.text(`Total Price: $${sale.totalPrice}`);
        doc.text(`Date: ${moment(sale.saleDate).format('YYYY-MM-DD HH:mm:ss')}`);
        doc.moveDown();
      });
      doc.end();
    } catch (err) {
      res.status(500).send('Server Error');
    }
  };
  

  exports.generateExcel = async (req, res) => {
    const { reportType, startDate, endDate } = req.query;
    const query = buildQuery(reportType, startDate, endDate);
  
    try {
      const sales = await Sale.find(query);
      const styles = {
        headerDark: {
          fill: {
            fgColor: {
              rgb: 'FF000000'
            }
          },
          font: {
            color: {
              rgb: 'FFFFFFFF'
            },
            sz: 14,
            bold: true
          }
        }
      };
  
      const specification = {
        productName: { displayName: 'Product Name', headerStyle: styles.headerDark, width: 120 },
        quantity: { displayName: 'Quantity', headerStyle: styles.headerDark, width: 100 },
        price: { displayName: 'Price', headerStyle: styles.headerDark, width: 100 },
        totalPrice: { displayName: 'Total Price', headerStyle: styles.headerDark, width: 100 },
        saleDate: { displayName: 'Sale Date', headerStyle: styles.headerDark, width: 150 }
      };
  
      const dataset = sales.map(sale => ({
        productName: sale.productName,
        quantity: sale.quantity,
        price: sale.price,
        totalPrice: sale.totalPrice,
        saleDate: moment(sale.saleDate).format('YYYY-MM-DD HH:mm:ss')
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
}