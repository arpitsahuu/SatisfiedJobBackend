const nodemailer = require('nodemailer');
const ErrorHandler = require('./ErrorHandlers');

exports.sendmail = (req, res, next, url) => {
	const transport = nodemailer.createTransport({
		service: 'gmail',
		host: 'smtp.gmail.com',
		port: 465,
		auth: {
			user: process.env.MAIL_EMAIL_ADDRESS,
			pass: process.env.MAIL_EMAIL_PASSWORD,
		},
	});

	const mailOptions = {
		from: 'Job portal  Company',
		to: req.body.email,
		subject: 'Password Reset Link',
		// "text":"Do not share this link",
		html: `<h1>Click Link Below to Reset Password</h1>
        <a href="${url}">Password Reset Link</a>`,
	};
	console.log("send Mail Message");
	transport.sendMail(mailOptions, (err, info) => {
		if (err) {
			console.log(err, "send Mail Message error");
			return next(new ErrorHandler(err, 500));
		}
		console.log(info);

		return res.status(200).json({
			message: 'Mail sent  Successfull!',
			url,
		});
	});
};
