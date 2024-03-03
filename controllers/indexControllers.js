const { catchAsyncError } = require('../middlewares/catchAsyncError');
const Student = require('../models/studentModel');
const Internship = require('../models/internshipModel');
const Job = require('../models/jobModel');
const ErrorHandler = require('../utils/ErrorHandlers');
const { sendtoken } = require('../utils/SendToken');
const { sendmail } = require('../utils/nodemailer');
const path = require('path');
const JobApplication = require('../models/jobApplicationModel');
const Employer = require('../models/employerModel');
const imageKit = require('../utils/imageKit').uploadImagekit();

exports.homepage = catchAsyncError((req, res, next) => {
	res.json({ message: 'Homepage of Internshala' });
});

exports.currentstudent = catchAsyncError(async (req, res, next) => {
	const student = await Student.findById(req.id).exec();
	res.json({ student });
});

exports.studentsignup = catchAsyncError(async (req, res, next) => {
	const student = await new Student(req.body).save();
	sendtoken(student, 200, res);
	res.status(201).json({ student });
});

exports.studentsignin = catchAsyncError(async (req, res, next) => {
	const student = await Student.findOne({ email: req.body.email })
		.select('+password')
		.exec();

	if (!student) {
		return next(
			new ErrorHandler('User not found with this Email Address', 404)
		);
	}
	const isMatch = student.comparepassword(req.body.password);
	if (!isMatch) return next(new ErrorHandler('Wrong Credientials', 500));

	sendtoken(student, 200, res,req);
});

exports.studentsignout = catchAsyncError(async (req, res, next) => {
	res.clearCookie('token');
	res.json({ message: 'Signout User!' });
});

exports.studentUpdate = catchAsyncError(async (req, res, next) => {
	await Student.findByIdAndUpdate(req.id, req.body).exec();
	res
		.status(200)
		.json({ success: true, student: Student, message: 'Student Updated Successfully!' });
});

exports.studentAvatar = catchAsyncError(async (req, res, next) => {
	const student = await Student.findById(req.id).exec();

	// Check if req.files and req.files.resuma are defined
	if (req.files && req.files.avatar) {
		const file = req.files.avatar;
		const modifiedName = `internshala-${Date.now()}${path.extname(file.name)}`;

		if (student.avatar.fileId !== '') {
			await imageKit.deleteFile(student.avatar.fileId);
		}

		const { fileId, url } = await imageKit.upload({
			file: file.data,
			fileName: modifiedName,
		});

		student.avatar = { fileId, url };
		await student.save();

		return res
			.status(200)
			.json({ success: true, message: 'Profile Picture Updated Successfully!' });
	} else {
		// Handle the case where req.files or req.files.resuma is undefined
		return res.status(400).json({ success: false, message: 'No resuma file provided.' });
	}
});


exports.studentResuma = catchAsyncError(async (req, res, next) => {
	const student = await Student.findById(req.id).exec();
	const file = req.files.resumePdf;
	const modifiedName = `internshala-${Date.now()}${path.extname(file.name)}`;

	if (student.resumePdf.fileId !== '') {
		await imageKit.deleteFile(student.resumePdf.fileId);
	}

	const { fileId, url } = await imageKit.upload({
		file: file.data,
		fileName: modifiedName,
	});

	student.resumePdf = { fileId, url };
	await student.save();

	res
		.status(200)
		.json({ success: true, message: 'Resuma Updated Successfully!' });
});

exports.studentsendmail = catchAsyncError(async (req, res, next) => {
	const student = await Student.findOne({ email: req.body.email }).exec();

	if (!student) {
		return next(
			new ErrorHandler('User not found with this Email Address', 404)
		);
	}

	const url = `${process.env.FROENTEND_URI}/studentForgetLink/${student._id
		}`;

	sendmail(req, res, next, url);
	student.resetpasswordToken = '1';
	await student.save();

	res.json({ student, url });
});


exports.studentforgetlink = catchAsyncError(async (req, res, next) => {
	const student = await Student.findById(req.params.id).exec();
	console.log(student);

	if (!student) {
		return next(
			new ErrorHandler('User not found with this Email Address', 404)
		);
	}

	if (student.resetpasswordToken == '1') {
		student.resetpasswordToken = '0';
		student.password = req.body.password;
		await student.save();
	} else {
		return next(new ErrorHandler('Invalid forget link ! try again', 500));
	}

	res.status(200).json({ message: 'Password Changed Successfully' });
});

exports.studentresetpassword = catchAsyncError(async (req, res, next) => {
	const student = await Student.findById(req.id).exec();
	console.log(student);
	student.password = req.body.password;
	await student.save();
	sendtoken(student, 201, res);
});

exports.studentUpdate = catchAsyncError(async (req, res, next) => {
	await Student.findByIdAndUpdate(req.id, req.body).exec();
	res
		.status(200)
		.json({ success: true, message: 'Student Updated Successfully!' });
});


exports.AllJobs = catchAsyncError(async (req, res, next) => {
	let queryObj = {};

	if (req.body.title) queryObj.title = req.body.title;
	if (req.body.location) queryObj.location = req.body.location;
	if (req.body.category) queryObj.category = req.body.category;
	if (req.body.experience) queryObj.experience = { $gte: req.body.experience };
	if (req.body.salary) queryObj.salary = req.body.salary;

	const page = req.body.page || 1;
	const limit = 3;
	const skip = (page - 1) * limit;


	const jobs = await Job.find(queryObj).populate("employer").skip(skip).limit(limit);

	const totalCount = await Job.countDocuments(queryObj);

	const totalPages = Math.ceil(totalCount / limit);

	res.status(200).json({ success: true, totalPages, currentPage: page, jobs });
});




/* applyForJob , getApplicationsByStudent */

exports.applyForJob = catchAsyncError(async (req, res) => {

	const { jobId, resume } = req.body;
	const job = await Job.findById(jobId).exec();
	const student = await Student.findById(req.id).exec();
	const employer = await Employer.findById(job.employer).exec();


	const application = new JobApplication({
		studentId: req.id,
		jobId,
		resume
	});
	await application.save();

	job.applications.push(application._id);
	await job.save();

	employer.applications.push(application._id);
	await employer.save();

	student.applications.push(application._id);
	await student.save();

	res.status(201).json({ message: 'Application submitted successfully' });
})




exports.getApplicationsByStudent = catchAsyncError(async (req, res) => {
	const student = await Student.findById(req.id).populate({
		path: 'applications',
		populate: {
			path: 'jobId',
			populate: {
				path: 'employer'
			}
		}
	});

	

	res.status(200).json({ success: true, applications: student.applications });
})








exports.applyInternship = catchAsyncError(async (req, res, next) => {
	const student = await Student.findById(req.id).exec();
	const internship = await Internship.findById(req.params.internshipid).exec();

	student.internships.push(internship._id);
	internship.students.push(student._id);

	await student.save();
	await internship.save();
	res.status(200).json({ success: true, message: 'Apply Successfully' });
});

exports.applyJob = catchAsyncError(async (req, res, next) => {
	const student = await Student.findById(req.id).exec();
	const job = await Job.findById(req.params.jobid).exec();

	student.jobs.push(job._id);
	job.students.push(student._id);

	await student.save();
	await job.save();
	res.status(200).json({ success: true, message: 'Apply Successfully' });
});

/* -------- Sensitive Delete Student ------ */
exports.deleteStudent = catchAsyncError(async (req, res, next) => {
	const deletingStudentId = req.id;
	try {
		const deletedStudent = await Student.findByIdAndDelete(deletingStudentId);
		if (!deletedStudent)
			return next(new ErrorHandler('Student Not Found', 404));
		res.status(200).json({
			status: true,
			message: 'Student Delete Successfully',
			deletedStudent,
		});
	} catch (error) {
		res.status(500).json({
			status: false,
			message: 'Internal server issue',
		});
	}
});
