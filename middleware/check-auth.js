const jwt = require('jsonwebtoken');
const HttpError = require("../models/http-error");

// 토큰 검증 미들웨어
module.exports = (req, res, next) => {
    
    if(req.method === 'OPTIONS') {
        return next();
    }
    
    // 1. 요청 헤더에서 토큰 추출
    const token = req.headers.authorization.split(' ')[1];

    try {
        // 2. 토큰이 존재하지 않으면 에러 발생
        if (!token) {
            throw new Error("인증 실패");
        }

        // 3. 토큰 검증
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);

        // 4. 검증이 성공하면 사용자 데이터를 요청 객체에 추가
        req.userData = { userId: decodedToken.userId };

        // 5. 다음 미들웨어로 진행
        next();
    } catch (err) {
        // 6. 토큰 검증 실패 시 403 상태코드와 함께 에러 응답
        const error = new HttpError("인증 실패", 403);
        return next(error);
    }
};
