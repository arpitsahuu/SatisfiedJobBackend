const express = require('express');
const {
	homepage,
	studentsignup,
	studentsignin,
	studentsignout,
	currentstudent,
	studentsendmail,
	studentforgetlink,
	studentresetpassword,
	studentUpdate,
	studentAvatar,
	applyInternship,
	applyJob,
	deleteStudent,
} = require('../controllers/indexControllers');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

// GET /
router.get('/', homepage);

// GET /student
router.post('/student', isAuthenticated, currentstudent);

// POST /student/signup
router.post('/student/signup', studentsignup);

// POST /student/signin
router.post('/student/signin', studentsignin);

// GET /student/signout
router.get('/student/signout', isAuthenticated, studentsignout);




// POST /student/send-mail
router.post('/student/send-mail', studentsendmail);

// GET /student/forget-link/:studentId
router.get('/student/forget-link/:id', studentforgetlink);

// POST /student/reset-password/:studentId
router.post(
	'/student/reset-password/:id',
	isAuthenticated,
	studentresetpassword
);


// POST /student/update/:studentId
router.post('/student/update', isAuthenticated, studentUpdate);

// POST /student/avatar/:studentId
router.post('/student/avatar', isAuthenticated, studentAvatar);

/* ---------- Delete Student * -------- */
// POST /student/delete/:studentId
router.delete('/student/delete', isAuthenticated, deleteStudent);

/* ------------ Apply Intership  ---------- */
// POST /student/apply/internship/:internshipid
router.post(
	'/student/apply/internship/:internshipid',
	isAuthenticated,
	applyInternship
);

/* ------------ Apply Job  ---------- */
// POST /student/apply/job/:jobid
router.post('/student/apply/job/:jobid', isAuthenticated, applyJob);

module.exports = router;
