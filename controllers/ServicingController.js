const Servicing = require('../models/Servicing');
const Product = require('../models/Product');
const { ServicingValidator } = require('../middlewares/Validator');

const ServicingController = {};

ServicingController.create = async (req, res) => {
    const { name, address, phone, product, quantity, deliveryDate, status } = req.body;
    const validator = ServicingValidator({ name, address, phone, product, quantity, deliveryDate, status });
    if (validator.error) {
        req.flash('error', validator.error);
        return res.redirect('/servicing');
    }
    const getProduct = await Product.findOne({code: validator.value.product});
    if(!getProduct) {
        req.flash('error', 'Product code doesn\'t match. Try again!');
        return res.redirect('/servicing');
    }
    try{
        const { name, address, phone, quantity, deliveryDate, status } = validator.value;
        servicing = new Servicing({
            name, address, phone, product: getProduct._id, quantity, deliveryDate, status
        });
        await servicing.save();
        req.flash('success', `New servicing has been successfully added!`);
        return res.redirect('/servicing');
    } catch (e) {
        req.flash('error', `Error While Saving Data - ${e}`);
        return res.redirect('/servicing');
    }
};

ServicingController.read = async (req, res) => {
    const perPage = 30;
    const page = req.params.page || 1;
    let allServicing = Servicing.find({}).populate('product');
    let count =  await Servicing.countDocuments();

    let queryString = {}, countDocs;
    let lookUpProduct = {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product',
    };
    let matchObj = {
        'phone': { $regex: req.query.searchQuery, $options: 'i'},
    }

    if (req.query.searchQuery) {
        allServicing = Servicing.aggregate().lookup(lookUpProduct).match(matchObj)
            .unwind({
                preserveNullAndEmptyArrays: true,
                path: '$product',
            });
        countDocs = Servicing.aggregate()
            .lookup(lookUpProduct)
            .match(matchObj);
        queryString.query = req.query.searchQuery;
    }
    if(countDocs) {
        countDocs = await countDocs.exec();
        count = countDocs.length;
    }

    allServicing = await allServicing.sort({createdAt: -1}).skip((perPage * page) - perPage).limit(perPage).exec();
    res.render('servicing/index', { allServicing, queryString, current: page, pages: Math.ceil(count / perPage)});
};

ServicingController.delete = async (req, res) => {
    await Servicing.findByIdAndDelete(req.params.id);
    req.flash('success', `Servicing has been deleted successfully!`);
    res.redirect('/servicing');
};

ServicingController.update = async (req, res) => {
    const newServicing = await Servicing.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    req.flash('success', `Servicing for ${newServicing.name} has been updated successfully!`);
    res.redirect('/servicing');
};

//API
ServicingController.getServicing = async (req, res) => {
    try {
        const { name, address, phone, product, quantity, deliveryDate, status } = await Servicing.findById(req.params.id).populate('product');
        if (name) {
            return res.send({
                name, address, phone, product, quantity, deliveryDate, status
            });
        }
        return res.send("Servicing Doesn't Exist");
    } catch (e) {
        return '';
    }
};


module.exports = ServicingController;
