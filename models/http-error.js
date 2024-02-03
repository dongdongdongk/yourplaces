// HttpError 클래스는 기본 JavaScript Error 클래스를 확장하여
// 사용자 정의 에러를 생성하는 역할을 합니다.

class HttpError extends Error {
    // 생성자 함수를 정의합니다. 메세지와 에러 코드를 받아와 초기화합니다.
    constructor(message, errorCode) {
        super(message); // 부모 클래스(Error)의 생성자를 호출하여 메세지를 설정합니다.
        this.code = errorCode; // 사용자 정의 에러 코드를 클래스의 프로퍼티로 설정합니다.
    }
}

// HttpError 클래스를 외부에서 사용할 수 있도록 모듈로 내보냅니다.
module.exports = HttpError;