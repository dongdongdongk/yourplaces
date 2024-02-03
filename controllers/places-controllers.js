const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const fs = require('fs');


// HttpError 모델을 불러와 사용합니다.
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/places');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');

// 특정 장소 ID에 대한 정보를 반환하는 함수입니다.
const getPlacesById = async (req, res, next) => {
    // 요청 파라미터에서 장소 ID를 추출합니다.
    const placeId = req.params.pid;

    let places;

    try {
        places = await Place.findById(placeId)
    } catch (err) {
        const error = new HttpError(
            "오류발생 장소를 찾지 못했습니다", 500
        )
        return next(error)
    }


    // 만약 장소를 찾지 못했다면 HttpError를 발생시키지 않고, next 함수를 통해 에러를 전달합니다.
    if (!places) {
        const error = new HttpError(
            "유효한 장소 아이디를 찾지 못했습니다", 404
        )
        return next(error);
    }


    // 찾은 장소를 JSON 형태로 응답합니다.
    res.json({ places: places.toObject({ getters: true }) });
};



// 특정 사용자 ID에 대한 장소 정보를 반환하는 함수입니다.
const getPlaceByUserId = async (req, res, next) => {
    // 요청 파라미터에서 사용자 ID를 추출합니다.
    const userId = req.params.uid;

    // let place;
    let userWithPlaces
    try {
        userWithPlaces = await User.findById(userId).populate('places')
    } catch (err) {
        const error = new HttpError("장소를 불러오는데 실패했습니다", 500)
        return next(error)
    }

    // 만약 사용자를 찾지 못했다면 HttpError를 발생시킵니다.
    if (!userWithPlaces) {
        return next(
            new HttpError('유저를 찾을 수 없습니다', 404)
        );
    }

    // 찾은 장소를 JSON 형태로 응답합니다.
    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
};



const createPlace = async (req, res, next) => {
    // express-validator를 사용하여 요청의 유효성을 검사합니다.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        // 에러가 배열로 나와서 첫 번째 인덱스의 경로를 사용하여 클라이언트에게 에러를 전달합니다.
        next(new HttpError(`${errors.errors[0].path}는 비어있을 수 없습니다`, 422));
    }

    // 요청에서 필요한 데이터를 추출합니다.
    const { title, description, address } = req.body;

    let coordinates;

    try {
        // 주소를 좌표로 변환하는 유틸리티 함수를 사용하여 좌표를 얻습니다.
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        // 좌표 얻기가 실패하면 에러를 핸들링하여 다음 미들웨어로 전달합니다.
        return next(error);
    }

    // 새로운 장소 객체를 생성합니다.
    const createPlace = new Place({
        title,
        description,
        address,
        location: coordinates, // 얻은 좌표 정보를 사용하여 새로운 장소의 위치를 설정합니다.
        image: req.file.path,
        creator : req.userData.userId
    });

    let user;
    try {
        // 생성자(creator) ID를 사용하여 해당 사용자를 데이터베이스에서 찾습니다.
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError('새로운 장소 추가에 실패 했습니다', 500);
        return next(error);
    }

    // 찾은 사용자가 없을 경우 에러를 생성하여 핸들링합니다.
    if (!user) {
        const error = new HttpError("제공된 ID의 유저를 찾을 수 없습니다", 404);
        return next(error);
    }

    try {
        // Mongoose 세션을 시작하고 트랜잭션을 시작합니다.
        const sess = await mongoose.startSession();
        sess.startTransaction();

        // 새로운 장소를 데이터베이스에 저장합니다.
        await createPlace.save({ session: sess });

        // 사용자 문서에 새로운 장소의 ID를 추가합니다.
        user.places.push(createPlace);
        await user.save({ session: sess });

        // 트랜잭션을 커밋합니다.
        await sess.commitTransaction();
    } catch (err) {
        console.log(err);
        const error = new HttpError("새 장소 추가 실패", 500);
        // 저장 중에 에러가 발생하면 500 상태 코드와 함께 에러를 생성합니다.
        return next(error);
    }

    // 클라이언트에게 성공적인 응답을 전송합니다.
    res.status(201).json({ place: createPlace });
};

const updatePlaceById = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors)
        throw new HttpError(`${errors.errors[0].path}는 비어있을 수 없습니다`, 422)
    }
    // 요청에서 필요한 데이터를 추출합니다.
    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;
    try {
        place = await Place.findById(placeId)
    } catch (err) {
        const error = new HttpError("업데이트 실패", 500)
        return next(error);
    }

    if(place.creator.toString() !== req.userData.userId) {
        console.log(place.creator)
        console.log(req.userData.userId)
        const error = new HttpError("장소를 수정할 권한이 없습니다.", 401)
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError("문제가 발생하였습니다 업데이트 할 수 없습니다", 500)
        return next(error);
    }

    // 클라이언트에게 업데이트된 장소 정보를 응답합니다.
    res.status(200).json({ place: place });
}



const deletePlaceById = async (req, res, next) => {
    // 요청 파라미터에서 장소의 ID를 가져옵니다.
    const placeId = req.params.pid;
    let place;

    // 장소를 찾아서 해당 ID로 검색한 결과를 가져옵니다.
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        // 에러가 발생하면 500 상태 코드와 함께 에러 메시지를 반환합니다.
        const error = new HttpError("문제발생 삭제에 실패했습니다", 500);
        return next(error);
    }

    // 검색된 장소가 없으면 404 상태 코드와 함께 에러 메시지를 반환합니다.
    if (!place) {
        const error = new HttpError("장소 id 를 찾지 못하였습니다", 404);
        return next(error);
    }

    if(place.creator.id !== req.userData.userId) {
        const error = new HttpError("장소를 삭제할 권한이 없습니다.", 401)
        return next(error);
    }

    // 이미지 주소 가져오기 (req.file.path 로 이미지 주소 들어가 있음)
    const imagePath = place.image;

    // MongoDB 세션을 사용하여 트랜잭션을 시작합니다.
    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();

        // 검색된 장소를 삭제합니다.
        await place.deleteOne({ session: sess });

        // 해당 장소를 생성한 사용자의 데이터에서 해당 장소를 제거합니다.
        place.creator.places.pull(place);

        // 수정된 사용자 데이터를 저장합니다.
        await place.creator.save({ session: sess })

        // 트랜잭션을 커밋하여 변경 사항을 영구적으로 반영합니다.
        await sess.commitTransaction();
    } catch (err) {
        // 트랜잭션 도중 에러가 발생하면 500 상태 코드와 함께 에러 메시지를 반환합니다.
        const error = new HttpError('삭제에 실패했습니다', 500);
        return next(error)
    }

    fs.unlink(imagePath, err => {
        console.log(err);
    });

    // 모든 작업이 성공적으로 완료되면 200 상태 코드와 함께 성공 메시지를 반환합니다.
    res.status(200).json({ message: '삭제성공' });
};


// 외부에서 사용할 수 있도록 함수를 내보냅니다.
exports.getPlacesById = getPlacesById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;