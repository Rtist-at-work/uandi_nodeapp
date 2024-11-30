const express = require('express');
const router = express.Router();
const bannerSchema = require('../models/banner');
const ageBanner = require('../models/ageBanner');
const posterSchema = require('../models/poster');
const category = require('../models/category')
const path = require('path');
const upload = require('../../uploadProduct')
const fetchImageData = require('../../fetchImageData')

router.post('/age', (req, res) => {
    upload.array('images', 10)(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                status: false,
                message: err.message // Error message for file format issues
            });
        }

        const { age } = req.body; // Retrieve ages from request body
        const images = req.files.map(file => file.id); // Convert images to Base64

        // Validate that the number of images matches the number of ages
        if (images.length !== age.length) {
            return res.status(400).json({
                status: false,
                message: "The number of images and ages must match."
            });
        }

        try {
            // Create and save each banner in parallel
            const results = await Promise.all(
                images.map((image, index) => 
                    new ageBanner({ images: image, age: age[index] }).save()
                )
            );

            res.json({
                results,
                status: true,
                message: "Banners Added Successfully"
            });
        } catch (err) {
            res.status(500).json({
                status: false,
                message: err.message
            });
        }
    });
});
router.post('/mainBanner', upload.array('images', 20), async (req, res) => {
    
    try {
        // Convert each file buffer to a base64 string
        const imageBase64Array = req.files.map((file) => file.id);
       

        // Group images in pairs
        const pairedImages = [];
        for (let i = 0; i < imageBase64Array.length; i += 2) {
            pairedImages.push(imageBase64Array.slice(i, i + 2));
        }
        // Assuming you want to save `pairedImages` to the database
        const posters = pairedImages.map((img)=>{
          const banner = new bannerSchema({
            images: img,
        });

        return banner.save();
        })

        await Promise.all(posters)
        res.json({
            status: true,
            message: "Banner Added Successfully"
        });
    } catch (err) {
        res.status(500).json({
            status: false,
            message: err.message
        });
    }
});
router.post('/poster', upload.array('images', 20), async (req, res) => {
  try {
      if (!req.files || req.files.length === 0) {
          return res.status(400).json({
              status: false,
              message: 'No images uploaded',
          });
      }

      // Extract the file IDs from uploaded files
      const images = req.files.map(file => file.id); // Assuming `file.id` is the GridFS file ID

      // Save each image as a separate document
      const saveImages = images.map(image => {
          const banner = new posterSchema({ images: image });
          return banner.save(); // Save returns a promise
      });

      // Wait for all save operations to complete
      await Promise.all(saveImages);

      res.json({
          status: true,
          message: 'Banners added successfully',
          results: images,
      });
  } catch (err) {
      console.log(err);
      res.status(500).json({
          status: false,
          message: 'An error occurred while saving the banners',
          error: err.message,
      });
  }
});

  router.get('/fetchage', async (req, res, next) => {
    try {
      const banner = await ageBanner.find();
      const mainbanner = await bannerSchema.find();
      const poster = await posterSchema.find();
      
      const parseAge = (ageString) => {
        const [minAge, maxAge] = ageString.split('/').map((s) => parseInt(s));
        const unit = ageString.includes('month') ? 'month' : 'year';
        return { minAge, unit };
      };
      
      // Function to sort based on age values and unit
      const sortAgeData = (banner) => {
        return banner.sort((a, b) => {
          const ageA = parseAge(a.age[0]);
          const ageB = parseAge(b.age[0]);
      
          // First, compare by unit (months < years)
          if (ageA.unit === 'month' && ageB.unit === 'year') {
            return -1; // months comes before years
          }
          if (ageA.unit === 'year' && ageB.unit === 'month') {
            return 1; // years comes after months
          }
      
          // If units are the same, compare by the min age
          return ageA.minAge - ageB.minAge;
        });
      };
      
      // Sorting the data
      const sortedData = sortAgeData(banner);
      
     
      // Store `mainbanner` on `req` to pass it to the next middleware
      req.mainbanner = mainbanner;
      req.agebanner = sortedData;
      req.poster = poster;
  
      // Collect all image IDs to fetch and store them on `req`
    //   const h = mainbanner.flatMap((bannerItem) => 
    //     bannerItem.images.flatMap((imageGroup) => imageGroup)
    //   );
    req.imageIds = [
      poster.flatMap((p)=>Array.isArray(p.images) ? p.images.flat() : p.images),
      banner.flatMap((p)=>Array.isArray(p.images) ? p.images.flat() : p.images),
      mainbanner.flatMap((p)=>Array.isArray(p.images) ? p.images.flat() : p.images),      
     ]
    
      // Call the middleware to fetch images
      next();
    } catch (err) {
      res.json({ status: false, message: err.message });
    }
  }, fetchImageData, async (req, res) => {
    try {
      // Fetch unique sizes
      const sizes = await category.aggregate([
        { $unwind: "$style" },
        { $unwind: "$style.sizes" },
        { $group: { _id: null, uniqueSizes: { $addToSet: "$style.sizes" } } },
        { $project: { _id: 0, uniqueSizes: 1 } }
      ]);
      // Use `req.mainbanner` and `req.imagesData` to form the response
      const mainbannerWithImages = {
        ...req.mainbanner,
        imagesData: req.imagesData[2]
      };
      const agebanner = {
        ...req.agebanner,
        imagesData: req.imagesData[1]
      };
      const poster = {
        ...req.poster,
        imagesData: req.imagesData[0]
      };
      
      return res.json({
        status: true,
        message: "success",
        banner: req.banner,  // if needed
        mainbanner: mainbannerWithImages,
        agebanner:agebanner,
        poster:poster,
        sizes: sizes.length > 0 ? sizes[0].uniqueSizes : []
      });
    } catch (err) {
      res.json({ status: false, message: err.message });
    }
  });
  
router.get('/delete', async(req,res)=>{
    const delId = req.query.delId
    try{
        const banner = await ageBanner.deleteOne({_id:delId});
        banner.save();
        return res.json({status:true,message:"banner deleted successfully"})
    }   
    catch(err){
        res.json({status:false,message:err.message});
    } 
})

// router.get('/getposter',async(req,res)=>{
//     try{
//         const banner = await posterSchema.find();
//         return res.json({status:true,message:"success",banner})
//     }
//     catch(err){
//         res.json({status:false,message:err.message});
//     } 
// })

router.put('/edit/:editId',upload.array('images',10),async (req, res) => {

    const { editId } = req.params;
    const { poster } = req.query;    
  const image = req.files.map((file)=>String(file.id));   
    try {
      if (!image) {
        return res.status(400).send({ message: 'No file uploaded' });
      }
      let updatedPoster;
      if(poster==="mainbanner"){
       updatedPoster = bannerSchema;
        
      }
      else{
       updatedPoster = posterSchema;
      }
      // Find the poster by its object id and update the image
      updatedPoster = await updatedPoster.findByIdAndUpdate(
        editId,
        { images: image},
        { new: true }
      );
      
      if (!updatedPoster) {
        return res.status(404).send({ message: 'Poster not found' });
      }
  
      res.status(200).send({ message: 'Banner updated successfully', banner: updatedPoster });
    } catch (error) {
      console.error('Error updating banner:', error);
      res.status(500).send({ message: 'Error updating banner' });
    }
  });
  router.delete('/delete/:posterId', async (req, res) => {
    const { posterId } = req.params;
    try {
        const result = await posterSchema.deleteOne({ _id: posterId });
        if (result.deletedCount > 0) {
            res.json({ status: true, message: "Poster deleted successfully" });
        } else {
            res.json({ status: false, message: "Poster not found, deletion failed" });
        }
    } catch (err) {
        res.json({ status: false, message: err.message });
    }
});

module.exports = router;
