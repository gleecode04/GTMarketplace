import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
    },

    author: {
        type: String,
        required: true,
    },

    content: {
        type: String,
        required: true,
    },

    date: {
        type: Date,
        required: true,
    }

});

const Message = mongoose.model("Message", messageSchema);
export default Message;