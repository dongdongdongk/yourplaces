// index.js

// Express 프레임워크를 가져옵니다.
const express = require('express');

const { check } = require('express-validator');

// places-controllers.js 파일에서 정의한 컨트롤러 함수를 가져옵니다.
const placeControllers = require('../controllers/places-controllers');

// Express의 Router를 사용하여 새로운 라우터를 생성합니다.
const router = express.Router();

// 파일 업로드 미들웨어를 가져옵니다.
const fileUpload = require('../middleware/file-upload');

const checkAuth = require('../middleware/check-auth');

// /api/places/:pid 라우트를 처리하는 미들웨어 함수입니다.
// 해당 라우트로 들어오는 GET 요청에 대해 placeControllers.getPlaceById 함수를 실행합니다.
router.get('/:pid', placeControllers.getPlacesById);

// /api/places/user/:uid 라우트를 처리하는 미들웨어 함수입니다.
// 해당 라우트로 들어오는 GET 요청에 대해 placeControllers.getPlaceByUserId 함수를 실행합니다.
router.get('/user/:uid', placeControllers.getPlaceByUserId);

// 인증 라우트 추가 아래의 라우터들은 미들웨어 인증을 통과해야지 실행된다 
router.use(checkAuth);


// 추가 
router.post('/',
    fileUpload.single('image'),

    [
        check('title')
            .not()
            .isEmpty(),
        check('description')
            .isLength({ min: 5 }),
        check('address')
            .not()
            .isEmpty()
    ],
    placeControllers.createPlace);

router.patch('/:pid',
    [
        check('title')
            .not()
            .isEmpty(),
        check('description').isLength({ min: 5 })
    ]

    , placeControllers.updatePlaceById);

router.delete('/:pid', placeControllers.deletePlaceById);

// 라우터를 모듈로 내보냅니다.
module.exports = router;
