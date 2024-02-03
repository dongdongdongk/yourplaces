const express = require('express');
const fs = require('fs');
const path = require('path');
const placesRoutes = require('./routes/places-route');
const usersRoutes = require('./routes/user-route');
const HttpError = require('./models/http-error');

const app = express();
// mongoose 라이브러리 불러오기
const mongoose = require('mongoose');

app.use(express.json()); // 본문 라우터 위에 있어야 한다 순서대로 읽기 때문
app.use(express.urlencoded({ extended: true }));


app.use('/uploads/images', express.static(path.join('uploads','images')));


// CORS 설정을 위한 미들웨어
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

    next();
});

// 라우터 설정
app.use('/api/places', placesRoutes); // => /api/places/ 로 시작하는 요청 라우팅
app.use('/api/users', usersRoutes);

// 에러 핸들링 미들웨어: 없는 페이지 에러 생성
app.use((req, res, next) => {
    const error = new HttpError('없는 페이지 입니다', 404);
    throw error;
});

// 에러 핸들링 미들웨어: 이전에 던져진 에러를 처리하는 미들웨어입니다.
app.use((error, req, res, next) => {
    // 파일이 존재하면 삭제
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        })
    }

    // 이미 응답이 전송되었는지 확인
    if (res.headersSent) {
        // 이미 응답이 전송된 경우 다음 에러 핸들러로 이동
        return next(error);
    }

    // 에러 응답을 전송
    res.status(error.code || 500).json({ message: error.message || "알 수 없는 에러" });
});

// MongoDB 서버에 연결
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ckluwao.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`)
    .then(() => {
        console.log("데이터 베이스 연결 성공");
    })
    .catch(() => {
        console.log("데이터 베이스 연결 실패");
    });

// 서버 리스닝
app.listen(5000);
