const exp = require('constants');
const { catchAsyncError } = require('../middlewares/catchAsyncError');
const Employer = require('../models/employerModel');
const ErrorHandler = require('../utils/ErrorHandlers');
const { sendtoken } = require('../utils/SendToken');
const { sendmail } = require('../utils/nodemailer');
const path = require('path');
const Internship = require('../models/internshipModel');
const Job = require('../models/jobModel');
const imageKit = require('../utils/imageKit').uploadImagekit();

exports.homepage = catchAsyncError((req, res, next) => {
	res.json({ message: 'Employer Homepage of Internshala' });
});

exports.currentemployer = catchAsyncError(async (req, res, next) => {
	const employer = await Employer.findById(req.id).exec();
	res.json({ employer });
});

exports.employersignup = catchAsyncError(async (req, res, next) => {
	const employer = await new Employer(req.body).save();
	sendtoken(employer, 200, res);
	// res.status(201).json({ employer });
});

exports.employersingin = catchAsyncError(async (req, res, next) => {
	const employer = await Employer.findOne({ email: req.body.email })
		.select('+password')
		.exec();

	if (!employer) {
		return next(
			new ErrorHandler('Employer not found with this Email Address', 404)
		);
	}
	const isMatch = employer.comparepassword(req.body.password);
	if (!isMatch)
		return next(new ErrorHandler('Wrong Employer Credientials', 500));

	sendtoken(employer, 200, res);
});

exports.employersignout = catchAsyncError(async (req, res, next) => {
	res.clearCookie('token');
	res.json({ message: 'Signout Employer done!' });
});

exports.employersendmail = catchAsyncError(async (req, res, next) => {
	const employer = await Employer.findOne({ email: req.body.email }).exec();

	if (!employer) {
		return next(
			new ErrorHandler('Employer not found with this Email Address', 404)
		);

	}
	const url = `${process.env.FROENTEND_URI}/admin/${employer._id}`;
	sendmail(req, res, next, url);
	employer.resetpasswordToken = '1';
	await employer.save();
	res.json({ employer, url });
});

exports.employerforgetlink = catchAsyncError(async (req, res, next) => {
	const employer = await Employer.findById(req.params.id).exec();

	if (!employer) {
		return next(
			new ErrorHandler('Employer not found with this Email Address', 404)
		);
	}

	if (employer.resetpasswordToken == '1') {
		employer.resetpasswordToken = '0';
		console.log(req.body, "req.body");
		employer.password = req.body.password;
		await employer.save();
	} else {
		return next(new ErrorHandler('Invalid forget link ! try again', 500));
	}

	res.status(200).json({ message: 'Password Changed Successfully' });
});

exports.employerresetpassword = catchAsyncError(async (req, res, next) => {
	const employer = await Employer.findById(req.id).exec();
	employer.password = req.body.password;
	await employer.save();
	sendtoken(employer, 201, res);
});


exports.employerUpdate = catchAsyncError(async (req, res, next) => {
	await Employer.findByIdAndUpdate(req.id, req.body, { new: true }).exec();
	res
		.status(200)
		.json({ success: true, message: 'Employer Updated Successfully!' });
});

exports.employerOrganisationLogo = catchAsyncError(async (req, res, next) => {
	const employer = await Employer.findById(req.id).exec();

	const file = req.files.organisationlogo;
	const modifiedName = `internshala-employer_org_logo-${Date.now()}${path.extname(
		file.name
	)}`;

	if (employer.organisationlogo.fileId !== '') {
		await imageKit.deleteFile(employer.organisationlogo.fileId);
	}

	const { fileId, url } = await imageKit.upload({
		file: file.data,
		fileName: modifiedName,
	});

	employer.organisationlogo = { fileId, url };
	await employer.save();

	res
		.status(200)
		.json({ success: true, message: 'Profile Picture Updated Successfully!' });
});



/* ------------ Job Controllers ---------- */

exports.createJob = catchAsyncError(async (req, res, next) => {
	const employer = await Employer.findById(req.id).exec();
	const job = await new Job(req.body);
	job.employer = employer._id;
	employer.jobs.push(job._id);
	await job.save();
	await employer.save();
	res.status(201).json({ success: true, job });
});

exports.readAllJob = catchAsyncError(async (req, res, next) => {
	const { jobs } = await Employer.findById(req.id).populate('jobs').exec();
	res.status(200).json({ success: true, jobs });
});

exports.readSingleJob = catchAsyncError(async (req, res, next) => {
	const job = await Job.findByIdAndUpdate(req.params.id, req.body).populate("employer").exec();
	res.status(200).json({ success: true, job });
});

/* ----------------All Applications----------------- */
exports.allApplications = catchAsyncError(async (req, res, next) => {
	const employer = await Employer.findById(req.id)
		.populate({
			path: 'jobs',
			populate: {
				path: 'applications',
				model: 'JobApplication'
			}
		})
		.exec();
	res.status(200).json({ success: true, applications: employer });
});


/* ------------ Intership Controllers ---------- */
exports.createInternship = catchAsyncError(async (req, res, next) => {
	const employer = await Employer.findById(req.id).exec();
	const internship = await new Internship(req.body);
	internship.employer = employer._id;
	employer.internships.push(internship._id);
	await internship.save();
	await employer.save();
	res.status(201).json({ success: true, internship });
});

exports.readAllInternship = catchAsyncError(async (req, res, next) => {
	const { internships } = await Employer.findById(req.id)
		.populate('internships')
		.exec();
	res.status(200).json({ success: true, internships });
});

exports.readSingleInternship = catchAsyncError(async (req, res, next) => {
	const internship = await Internship.findById(req.params.id).exec();
	res.status(200).json({ success: true, internship });
});

/* -------- Sensitive Delete Employer ------ */
exports.deleteEmployer = catchAsyncError(async (req, res, next) => {
	const deletingEmployerId = req.id;
	try {
		const deletedEmployer = await Employer.findByIdAndDelete(deletingEmployerId);
		if (!deletedEmployer)
			return next(new ErrorHandler('Student Not Found', 404));
		res.status(200).json({
			status: true,
			message: 'Employer Account Deleted Successfully',
			deletedEmployer,
		});
	} catch (error) {
		res.status(500).json({
			status: false,
			message: 'Internal server issue',
		});
	}
});
