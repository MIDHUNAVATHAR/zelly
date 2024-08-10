

const multer = require("multer") ;  

 const uploadLogo = multer({
    storage :  multer.diskStorage ({ 
        destination : "uploads/logo",   
        filename    : (req , file , cb ) =>{ 
            cb(null , Date.now() + file.originalname)  
        }
     })
 }).single("logo");  

 const uploadBanner = multer({
    storage :  multer.diskStorage ({ 
        destination : "uploads/banner",   
        filename    : (req , file , cb ) =>{ 
            cb(null , Date.now() + file.originalname ) ;   
        }
     })
 }).single("banner");


//import schemas
const User = require("../../models/userSchema");
const GenderCategory = require("../../models/genderCategory");
const ProductCategory = require("../../models/productCategory"); 
const ProductSubCategory = require("../../models/productSubCategory");
const Logo = require("../../models/logoSchema");  
const Banner = require("../../models/bannerSchema");
const Product = require("../../models/product"); 


 //get dashboard 
 const dashboard = (req,res) =>{ 
    if(req.session.adminId){ 
    res.render("admin-dashboard.ejs" ,{admin : req.session.adminEmail , partial : "partials/dashboard" }) ;  
    }else{
        res.redirect("/admin"); 
    }
 } 
 
 //get front page logo banner 
 const frontPage = async (req,res) =>{ 
    const logo = await Logo.find();
    const banner = await Banner.find();
    console.log(banner);
    res.render("admin-dashboard" ,{admin: req.session.adminEmail , partial :"partials/front-page-img-add" ,logo , banner} ); 
 }

 //post front page logo
 const frontPageLogo = (req , res) =>{ 
    uploadLogo(req,res , (err) =>{
        if(err){
            console.log(err);
            return;
        }else{ 
            const logo = new Logo({ 
                image : {
                    data :  `/uploads/logo/${req.file.filename}`,   
                    contentType: req.file.mimetype,
                }
            })
            logo.save().then(()=> res.redirect("/admin/frontPage")  ).catch((err)=>console.log(err)) ;  
        }
    })
 }

 //post front page banner images
 const frontPageBanner = ( req , res ) =>{   
    uploadBanner(req , res ,(err)=>{  
        if(err){
            console.log(err);
            return;
        }else{
            const banner = new Banner({
                image :{
                    data : `/uploads/banner/${req.file.filename}`,
                    ContentType : req.file.mimetype,
                }
            })
            banner.save().then(()=> res.redirect("/admin/frontPage")).catch((err)=>console.log(err)); 
        }
    })  
 } 

 //get customers
 const customers = async (req, res) =>{
     //pagination 
     const page = parseInt(req.query.page) || 1 ;   
     const limit = 7;
     const sort = req.query.sort || 'asc' ; 
     const sortOrder =  sort === 'asc' ? 1 : -1 ;
     const startIndex = (page - 1) *limit ;
     const endIndex   = page * limit ;
     
     const search = req.query.search || '' ;
     const query = search 
     ? { 
         $or: [
             { firstName: { $regex: search, $options: 'i' } }, 
             { email: { $regex: search, $options: 'i' } }
         ] 
     }
     : {};

     const users = await User.find(query).sort({ joinedDate: sortOrder })  
     const totalUsers =users.length; // Get the total number of users

     const resultUsers = users.slice( startIndex , endIndex );
     res.render("admin-dashboard.ejs" , {partial : "partials/cust" ,admin : req.session.adminEmail , users : resultUsers,currentpage :page,totalUsers:totalUsers,limit:limit,sort:sort});

 }

 //get delete customers
 const userDel = async ( req ,res ) =>{ 
    try{
        const deletId = req.query.id;
        await User.findByIdAndDelete(deletId);
        res.redirect("/admin/customers") ; 
    }catch(err){ 
        console.log(err.message) ; 
    }
}

//get edit user
const userEdit = async (req,res) =>{ 
    try{
      const userId =  req.query.id;
      const user = await User.findById(userId);
      res.render("admin-dashboard.ejs" ,{ partial : "partials/edit-user",user:user ,admin : req.session.adminEmail}); 
    }catch(err){
        console.log(err.message);
    }
}

//post user edit
const updateUsers = async (req,res) =>{
    try {
        let { userId, firstName, lastName, email, password } = req.body ;
        firstName = firstName.trim();
        lastName  = lastName.trim();
        email     = email.trim();
        password  = password.trim();
        const updates = { firstName, lastName, email };
        if (password) {
            updates.password = password ; 
        }
        await User.findByIdAndUpdate(userId, updates);
        res.redirect('/admin/customers');
    } catch (err) {
        console.log(err);
        res.status(500).send('Error updating user');
    }
}

//post user status
const updateStatus = async (req,res) =>{
     const userId = req.params.id;
     const { status } = req.body;
     await User.findByIdAndUpdate(userId , { status } );
     res.redirect('/admin/customers');
}  

//get addcategory
const addCategory = async (req , res) =>{  
    const genderCategories = await GenderCategory.find();
    const productCategories = await ProductCategory.find().populate('genderCategory');
    const productSubCategories = await ProductSubCategory.find().populate('genderCategory').populate('productCategory');
    res.render("admin-dashboard.ejs" ,{ partial : "partials/add-category", admin : req.session.adminEmail , genderCategories , productCategories , productSubCategories}) ; 
}

//post addGenderCategory
const addGenderCategory = async (req,res) =>{
    let {name} = req.body;
    name = name.trim().toUpperCase();  
    await GenderCategory.create({name});
    res.redirect("/admin/addCategory");
} 

//post addproduct category
const addProductCategory = async (req,res) =>{
    let {name , genderCategory} = req.body ; 
    name = name.trim().toUpperCase(); 
    await ProductCategory.create({name , genderCategory});  
    res.redirect("/admin/addCategory");  
}

//post addproductsub category
const addProductSubCategory = async (req,res) =>{
    let {name , genderCategory , productCategory } = req.body ; 
    name = name.trim().toUpperCase(); 
    await ProductSubCategory.create({name ,genderCategory , productCategory});
    res.redirect("/admin/addCategory");
}


module.exports = { dashboard , frontPageLogo, frontPageBanner, customers ,userDel ,userEdit ,updateUsers ,updateStatus, addCategory ,addGenderCategory ,addProductCategory ,addProductSubCategory ,frontPage} ;  