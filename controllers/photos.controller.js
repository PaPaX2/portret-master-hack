const Photo = require('../models/photo.model');
const Vote = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const validFile = fileName.split('.').slice(-1)[0];

      function escape(html) {
        return html.replace(/&/g, "&amp;")
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;")
                   .replace(/"/g, "&quot;")
                   .replace(/'/g, "&#039;");
      }
      const validTitle = escape(title);
      const validAuthor = escape(author);

      if((validFile == 'jpg' || validFile == 'png' || validFile == 'gif' ) &&
        title.length <= 25 &&
        author.length <= 50 &&
        ((validTitle.includes("&") == false) && (validAuthor.includes("&") == false)) &&
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)
        ){
        const newPhoto = new Photo({ title: validTitle, author: validAuthor, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }
      else throw new Error('Wrong input extension!');

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const voter = await Vote.findOne({ user: req.ip });
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      if (voter) {
        if (voter.votes.includes(photoToUpdate._id)) {
          res.status(500).json(err);
        } else {
          voter.votes.push(photoToUpdate._id);
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({ message: 'OK' });
        }
      } else {
        const newVoter = new Vote({
          user: req.ip,
          votes: [photoToUpdate._id]
        });
        await newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
