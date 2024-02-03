// Express에서 사용하는 외부 라이브러리 및 모듈 불러오기
const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 커스텀 HTTP 에러 모델 및 사용자 모델 불러오기
const HttpError = require('../models/http-error');
const User = require('../models/user');

// 유저 목록 조회
const getUsers = async (req, res, next) => {
    let users;
    try {
        // 데이터베이스에서 모든 사용자 정보를 불러옴 (비밀번호 제외)
        users = await User.find({}, '-password');
    } catch (err) {
        // 에러 발생 시 500 상태코드로 에러 응답
        const error = new HttpError("유저 정보를 불러오지 못했습니다", 500);
        return next(error);
    }
    res.json(users);
}

// 회원가입
const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // 유효성 검사 에러가 있을 경우, 해당 에러를 422 상태코드로 응답
        const error = new HttpError(`${errors.errors[0].path}는 비어있을 수 없습니다`, 422);
        return next(error);
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        // 이메일 중복 체크
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        // 에러 발생 시 500 상태코드로 에러 응답
        const error = new HttpError("회원가입 실패", 500);
        return next(error);
    }

    if (existingUser) {
        // 중복된 이메일이 이미 존재할 경우, 422 상태코드로 에러 응답
        const error = new HttpError("이미 유저가 있습니다.", 422);
        return next(error);
    }

    let hashedPassword;
    try {
        // 비밀번호 암호화
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        // 암호화 중 에러 발생 시, 500 상태코드로 에러 응답
        const error = new HttpError('사용자를 생성하지 못했습니다', 500);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        image: req.file.path,
        password: hashedPassword,
        places: []
    });

    try {
        // 새로운 사용자 정보 저장
        await createdUser.save();
    } catch (err) {
        // 저장 중 에러 발생 시, 500 상태코드로 에러 응답
        const error = new HttpError('회원 저장에 오류가 발생했습니다', 500);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            { userId: createdUser._id, email: createdUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        );
    } catch (err) {
        const error = new HttpError("토큰 생성에 실패하였습니다", 500);
        return next(error);
    }

    // 회원가입 성공 시, 201 상태코드로 응답
    res.status(201).json({ userId: createdUser._id, email: createdUser.email, token: token });
}

// 로그인
const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        // 이메일로 사용자 찾기
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        // 조회 중 에러 발생 시, 500 상태코드로 에러 응답
        const error = new HttpError("로그인 실패", 500);
        return next(error);
    }

    if (!existingUser) {
        // 사용자가 없거나 비밀번호가 일치하지 않을 경우, 403 상태코드로 에러 응답
        const error = new HttpError("유저 정보가 틀립니다", 403);
        return next(error);
    }

    let isValidPassword = false;
    try {
        // 해시된 비밀번호 비교
        isValidPassword = await bcrypt.compare(password, existingUser.password)
    } catch (err) {
        // 해시 비교 중 에러 발생 시, 500 상태코드로 에러 응답
        const error = new HttpError("해싱 암호를 비교하는데 실패 했습니다", 500);
        return next(error);
    }

    if (!isValidPassword) {
        // 비밀번호 불일치 시, 401 상태코드로 에러 응답
        const error = new HttpError("유저 정보가 틀립니다", 401);
        return next(error);
    }

    let token;
    try {
        token = jwt.sign(
            { userId: existingUser._id, email: existingUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
            );
        } catch (err) {
            const error = new HttpError("토큰 생성에 실패하였습니다", 500);
            return next(error);
        }


    // 로그인 성공 시, 성공 메시지와 사용자 정보를 JSON 형태로 응답
    res.status(201).json({
        userId: existingUser._id,
        email: existingUser.email,
        token : token
    });
}


// 모듈 내보내기
exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;