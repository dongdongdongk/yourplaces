const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const placeSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    location: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    creator: { type: mongoose.Types.ObjectId ,required : true, ref : 'User'}
})

module.exports = mongoose.model('Place', placeSchema) // 두개의 인자를 받음 첫 인자는 모델의 이름 대문자로 단수형으로 ( 알아서 복수로 바꿔줌, 이후 컬렌션의 이름 ) 두번째 인수는 모델에 참조할 스키마  