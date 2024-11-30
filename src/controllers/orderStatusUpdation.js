const Order = require('../models/orderModel');
const User = require('../models/usermodel');

const orderStatusUpdation = async (socket, data,userSockets,io) => {
    const { value, orderId, userId } = data;
    const newStatus = value;

    try {
        // Find user and update the order in user's order history 
        const user = await User.findById(userId);
        const order = user.orderHistory.find(order => order.orderId === orderId);
        order.status = value;
        await user.save();

        // Update the order in the Order collection (as before)
        const orderRecord = await Order.findOne({ orderId });
        orderRecord.status = value;
        await orderRecord.save();

        // Emit the updated order status to all connected clients (admins, users)
        const userSocketId = userSockets[userId];
    if (userSocketId) {
        console.log("ojnfojnv")
        io.to(userSocketId).emit('orderStatusUpdated', { userSocketId, orderId, newStatus });
    }

        // Optionally, emit back to the current user (socket)
        socket.emit('status_update_success', { message: "Order status updated successfully" ,'value' : value}       );

    } catch (err) {
        console.log(err);
        socket.emit('status_update_error', { message: "An error occurred while updating the order status" });
    }
};
 
module.exports = orderStatusUpdation ; 