const mongoose = require('mongoose');

const jobModel = mongoose.Schema(
	{
		students: [{ type: mongoose.Schema.Types.ObjectId, ref: "student" }],
		employer: { type: mongoose.Schema.Types.ObjectId, ref: 'employer' },
		title: String,
		skills: [String],
		jobType: { type: String, enum: ['In Office', 'Remote'] },
		category: { type: String, enum: ['Internship', 'job'] },
		description: String,
		preferences: String,
		openings: Number,
		location: String,
		salary: Number,
		perks: [String],
		assessment: String,
	},
	{ timestamps: true }
);

const Job = mongoose.model('job', jobModel);
module.exports = Job;
