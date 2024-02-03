// Express 프레임워크를 가져옵니다.
const express = require('express');
const { check } = require('express-validator');

// 사용자 컨트롤러 로직을 가져옵니다.
const usersController = require('../controllers/users-controllers');

// Express의 라우터를 생성합니다.
const router = express.Router();

// 파일 업로드 미들웨어를 가져옵니다.
const fileUpload = require('../middleware/file-upload');

// 사용자 목록을 반환하는 라우트
router.get('/', usersController.getUsers);

// 사용자 가입을 처리하는 라우트
router.post('/signup',
    // 파일 업로드 미들웨어를 실행합니다. 하나의 이미지 파일만 처리하며, 'image'라는 필드에서 파일을 받습니다.
    fileUpload.single('image'),

    // 사용자 입력 유효성을 검사하는 미들웨어를 설정합니다.
    [
        // 'name' 필드가 비어있는지 확인합니다.
        check('name')
            .not()
            .isEmpty(),

        // 'email' 필드를 정규화하고 이메일 형식인지 확인합니다.
        check('email')
            .normalizeEmail() // Test@test.com => test@test.com 변환
            .isEmail(), // 이메일 형식인지 확인

        // 'password' 필드가 최소 6자 이상인지 확인합니다.
        check('password')
            .isLength({ min: 6 })
    ],

    // 가입 로직을 처리하는 컨트롤러 함수
    usersController.signup);

// 사용자 로그인을 처리하는 라우트
router.post('/login', usersController.login);

// 라우터를 모듈로 내보냅니다.
module.exports = router;
