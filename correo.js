const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "marioplantabaja@gmail.com",
    pass: "pvcoahphnavarflx",
  },
});

const send = async (nombre, descripcion, monto, correos) => {
  let mailOptions = {
    from: "marioplantabaja@gmail.com",
    to: ["marioplantabaja@gmail.com"],
    subject: `Estan revisando tu prueba`,
    html: `<h3>Alguien esta revisando tu prueba</h3>`,
  };
  try {
    const result = await transporter.sendMail(mailOptions);
  } catch (e) {
    throw e;
  }
};

module.exports = { send };
