import jwt from "jsonwebtoken";
import { Faculty, Student, UserRoles } from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// function to generate token to login
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES,
    }
  );

  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES,
    }
  );

  return { accessToken, refreshToken };
};

// function to register a student
export const registerStudent = async (request, reply) => {
  try {
    const {
      name,
      email,
      password,
      mobileNumber,
      rollNumber,
      course,
      session,
      semester,
    } = request.body;

    const isEmailExists = await Student.findOne({ email });
    if (isEmailExists) {
      return reply.code(400).send({
        success: false,
        message: "Email already exists",
      });
    }

    const student = await Student.create({
      name,
      email,
      password,
      mobileNumber,
      rollNumber,
      course,
      session,
      semester,
      role: UserRoles.STUDENT,
    });

    return reply.code(201).send({
      success: true,
      message: "Student registered successfully",
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
      },
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};

// function to register a faculty
export const registerFaculty = async (request, reply) => {
  try {
    const {
      name,
      email,
      password,
      mobileNumber,
      facultyId,
      department,
      designation,
      course,
    } = request.body;

    const isEmailExists = await Faculty.findOne({ email });
    if (isEmailExists) {
      return reply.code(400).send({
        success: false,
        message: "Email already exists",
      });
    }

    const faculty = await Faculty.create({
      name,
      email,
      password,
      mobileNumber,
      facultyId,
      department,
      course,
      designation,
      role: UserRoles.FACULTY,
    });

    return reply.code(201).send({
      success: true,
      message: "Faculty registered successfully",
      faculty: {
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        role: faculty.role,
      },
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};

// login user
export const loginUser = async (request, reply) => {
  try {
    const { email, password } = request.body;

    const user =
      (await Student.findOne({ email }).select("+password")) ||
      (await Faculty.findOne({ email }).select("+password"));

    if (!user) {
      return reply.code(401).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return reply.code(401).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    return reply.code(200).send({
      success: true,
      message: "Login successful",
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};

// function for refresh tokens
export const refreshTokens = async (request, reply) => {
  try {
    const { refreshToken } = request.body;
    if (!refreshToken) {
      return reply.code(401).send({
        success: false,
        message: "Refresh Token Missing",
      });
    }

    const decodedData = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
    let user = null;

    if (decodedData.role === UserRoles.STUDENT) {
      user = await Student.findById(decodedData.id);
    } else if (decodedData.role === UserRoles.FACULTY) {
      user = await Faculty.findById(decodedData.id);
    }

    if (!user) {
      return reply.code(403).send({
        success: false,
        message: "User not found",
      });
    }

    const tokens = generateTokens(user);
    return reply.code(200).send({
      success: true,
      message: "Tokens refreshed successfully",
      ...tokens,
    });
  } catch (error) {
    return reply.code(403).send({
      success: false,
      message: "Invalid Refresh Token",
    });
  }
};

// function to fetch user details
export const fetchUserDetails = async (request, reply) => {
  const { id, role } = req.user;

  let user = null;

  if (role === UserRoles.STUDENT) {
    user = await Student.findById(id);
  } else if (role === UserRoles.FACULTY) {
    user = await Faculty.findById(id);
  } else {
    return reply.code(400).send({
      success: false,
      message: "Invalid user role",
    });
  }

  if (!user) {
    return reply.code(404).send({
      success: false,
      message: "User not found",
    });
  }

  return reply.code(200).send({
    success: true,
    message: "User details fetched successfully",
    user,
  });
};

// function for fetch STUDENT
export const fetchStudent = async (request, reply) => {
  try {
    const { id } = request.params;
    const student = await Student.findById(id);
    if (!student) {
      return reply.code(404).send({
        success: false,
        message: "Student not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Student fetched successfully",
      student,
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};
// function for fetch faculty
export const fetchFaculty = async (request, reply) => {
  try {
    const { id } = request.params;
    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return reply.code(404).send({
        success: false,
        message: "Faculty not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Faculty fetched successfully",
      faculty,
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};

// function to update student profile
export const updateStudentProfile = async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, email, mobileNumber, rollNumber, course, session, semester } =
      request.body;

    const student = await Student.findById(id);
    if (!student) {
      return reply.code(404).send({
        success: false,
        message: "Student not found",
      });
    }

    student.name = name;
    student.email = email;
    student.mobileNumber = mobileNumber;
    student.rollNumber = rollNumber;
    student.course = course;
    student.session = session;
    student.semester = semester;

    await student.save();

    return reply.code(200).send({
      success: true,
      message: "Student profile updated successfully",
      student,
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};
// function to update faculty profile
export const updateFacultyProfile = async (request, reply) => {
  try {
    const { id } = request.params;
    const { name, email, mobileNumber, facultyId, department, designation } =
      request.body;

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return reply.code(404).send({
        success: false,
        message: "Faculty not found",
      });
    }

    faculty.name = name;
    faculty.email = email;
    faculty.mobileNumber = mobileNumber;
    faculty.facultyId = facultyId;
    faculty.department = department;
    faculty.designation = designation;

    await faculty.save();

    return reply.code(200).send({
      success: true,
      message: "Faculty profile updated successfully",
      faculty,
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};

// function to toggle user active status
export const toggleUserActiveStatus = async (request, reply) => {
  try {
    const { id } = request.params;
    const user = (await Student.findById(id)) || (await Faculty.findById(id));
    if (!user) {
      return reply.code(404).send({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return reply.code(200).send({
      success: true,
      message: "User active status updated successfully",
      user,
    });
  } catch (error) {
    throw new ErrorHandler(error.message, 500);
  }
};
