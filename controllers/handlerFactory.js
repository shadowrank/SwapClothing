const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');
const User = require('../models/userModel');
const Item = require('../models/itemModel');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let doc;
    if (Model.modelName === 'Item' && req.user.role !== 'admin') {
      doc = await Model.findById(req.params.id);
      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }
      if (doc.owner.toString() !== req.user.id) {
        return next(
          new AppError(
            'You do not have permission to delete this document',
            403,
          ),
        );
      }
    }
    doc = await Model.findById(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID ', 404));
    }
    //to restric the deletion of an admin
    if (Model === User && doc.role === 'admin') {
      return next(new AppError('You cannot delete an admin', 401));
    }

    await Model.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400,
        ),
      );
    }

    let doc;
    if (Model.modelName === 'Item' && req.user.role !== 'admin') {
      doc = await Model.findById(req.params.id);
      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }
      if (doc.owner.toString() !== req.user.id) {
        return next(
          new AppError(
            'You do not have permission to update this document',
            403,
          ),
        );
      }
    }

    doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (Model === Item) {
      req.body.owner = req.user.id;
      req.body.views = 0;
    }
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

  const incrementViews = async (doc, user) => {
    if (user) {
      if (
        // Only increment views if the user is not the owner and is not an admin
        doc.owner._id.toString() !== user.id &&
        user.role !== 'admin'
      ) {
        doc.views += 1; // Increment views
        await doc.save(); // Wait for save to complete before continuing
      }
    }
  };
  
  exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
      let query = Model.findById(req.params.id);
      if (popOptions) query = query.populate(popOptions);
      
      const doc = await query;
      
      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }
      
      if (Model === Item) {
        doc.owner.deviceSessions = undefined; // Assuming you want to omit the deviceSessions field
        await incrementViews(doc, req.user); // Ensure views are incremented before sending the response
      }
      
      res.status(200).json({
        status: 'success',
        data:  doc,
      });
    });
  
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.userId) filter = { owner: req.params.userId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: doc,
    });
  });

exports.deleteAll = (Model) =>
  catchAsync(async (req, res, next) => {
    await Model.deleteMany();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
