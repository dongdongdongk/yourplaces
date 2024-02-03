const multer = require('multer');
const { v4: uuid } = require('uuid');

// 파일의 MIME 타입과 확장자를 매핑하는 객체
const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

// multer를 사용하여 파일 업로드를 처리하는 미들웨어 생성
const fileUpload = multer({
    // 파일 크기 제한 (500KB)
    limits: 500000,

    // 파일 저장 설정 (디스크 스토리지)
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            // 파일 저장 경로 설정 ('uploads/images' 폴더)
            callback(null, 'uploads/images');
        },
        filename: (req, file, callback) => {
            // 파일 이름 설정 (고유한 UUID + 확장자)
            const ext = MIME_TYPE_MAP[file.mimetype]; // 파일의 .mimetype 을 찾아내서 MIME_TYPE_MAP 중 일치하는 값으로 매핑 ex) const ext = MIME_TYPE_MAP['image/png'];
            callback(null, uuid() + '.' + ext);
        },
        
        // 파일 필터링 (유효한 MIME 타입 여부 확인)
        fileFilter: (req, file, callback) => {
            // 유효한 MIME 타입인지 여부를 확인하고 isValid 변수에 저장
            const isValid = !!MIME_TYPE_MAP[file.mimetype]; // 이는 
            
            // 유효하지 않은 MIME 타입이면 오류 생성, 그렇지 않으면 오류는 null
            let error = isValid ? null : new Error('파일 유형이 유효하지 않습니다.');
            
            // 오류와 함께 isValid 값을 콜백으로 전달
            callback(error, isValid); // isValid가 true면 파일 수용, 아니면 수용하지 않음
        } 
    }), 
});

module.exports = fileUpload;