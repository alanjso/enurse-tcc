const rp = require("request-promise-native");
const config = require('config');
const uri = config.get('flexExports');

module.exports = {
  async exportPdf(filename, reportname, header, body, res) {
    var options = {
      method: 'POST',
      uri: `${uri}/exports/pdf`,
      encoding: "binary",
      body: {
        reportname,
        header,
        data: body
      },
      json: true
    };
    try {
      const response = await rp(options);
      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Length", response.length);
      res.setHeader("Content-type", "application/pdf; charset=utf-8");
      res.send(Buffer.from(response, "binary"));
    } catch (err) {
      console.log(err);
      res.json({ error: 'Nenhum resultado encontrado' });
    }
  },
  async exportExcel(filename, reportname, header, body, res) {
    const rp = require("request-promise-native");
    var options = {
      method: 'POST',
      uri: `${uri}/exports/excel`,
      encoding: "binary",
      body: {
        reportname,
        header,
        data: body
      },
      json: true
    };

    try {
      const response = await rp(options);
      res.setHeader("Content-disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Length", response.length);
      res.setHeader("Content-type", "application/xlsx; charset=utf-8");
      res.send(Buffer.from(response, "binary"));
    } catch (err) {
      console.log(err);
      res.json({ error: 'Nenhum resultado encontrado' });
    }

  }
};
