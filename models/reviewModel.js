// review / rating / createAt / ref to tour / ref to user
const mongoose = require('mongoose');
const Tour = require('./tourModel');
const { findByIdAndUpdate, findByIdAndDelete } = require('./userModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      max: 5,
      min: 1,
    },
    createAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.select('-__v').populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// Tạo phương thức tĩnh "calcAverageRatings" trong Schema
// 1. Tính toán trung bình và số lượng đánh giá bằng "aggregate"
// 2. Cập nhật giá trị vào Model
// 3. Khi tạo mới một review, gọi "calcAverageRatings" để thực hiện cập nhật lại giá trị
// 3.1 this -> Document Review đang được tạo
// 3.2 this.constructor -> Modal reviewSchema nơi tạo phương thức "calcAverageRatings"
// 3.3 this.tour -> thuộc tính tour của Document Review
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, // Tìm kiếm bản ghi có cùng tourId trong Document "Reviews"
    },
    {
      $group: {
        // Nhóm các bản ghi cùng ID, cộng tổng số lượng các bản ghi và tính trung bình theo $rating
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      // Tìm trong Collection "Tour" các bản ghi có cùng ID, cập nhật 2 giá trị tương ứng

      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post('save', function () {
  // This points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// Các hook <findByIdAndUpdate,findByIdAndDelete> không truy cập trực tiếp vào Document Middleware để lấy thông tin. Chỉ tồn lại Querry Middleware để chỉnh sửa truy vấn trên Database
// -> Sử dụng post-middleware với tham số doc sẽ trỏ đến document đang được lưu
// findByIdAndUpdate;
// findByIdAndDelete;

reviewSchema.post(/^findOneAnd/, async function (doc) {
  await doc.constructor.calcAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
