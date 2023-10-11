const Album = require('../models/album');
const Genre = require('../models/genre');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const album = require('../models/album');

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render('genre_list', {
    title: 'Genre List',
    genre_list: allGenres,
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, albumsInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Album.find({ genre: req.params.id }).populate('artist').exec(),
  ]);
  if (genre === null) {
    // No results.
    const err = new Error('Genre not found');
    err.status = 404;
    return next(err);
  }

  res.render('genre_detail', {
    title: 'Genre Detail',
    genre: genre,
    genre_albums: albumsInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body('name', 'Genre name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: req.body.name }).exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];

//Display Genre delete form on GET
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, albumsInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Album.find({ genre: req.params.id }, 'title artist')
      .populate('artist')
      .exec(),
  ]);
  if (genre === null) {
    // No results.
    const err = new Error('Genre not found');
    err.status = 404;
    return next(err);
  }

  if (albumsInGenre.length > 0) {
    // Genre has albums. Render in same way as for GET route.
    res.render('genre_delete', {
      title: 'Delete Genre',
      genre: genre,
      genre_albums: albumsInGenre,
    });
    return;
  } else {
    // Genre has no books. Delete object and redirect to the list of genres.
    await Genre.findByIdAndRemove(genre.id);
    res.redirect('/genres');
  }
});

// Handle Genre delete on POST
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, albumsInGenre] = await Promise.all([
    Genre.findById(req.body.genreid).exec(),
    Album.find({ genre: req.body.genreid }, 'title artist')
      .populate('artist')
      .exec(),
  ]);

  if (albumsInGenre.length > 0) {
    // Genre has albums. Render in same way as for GET route.
    res.render('genre_delete', {
      title: 'Delete Genre',
      genre: genre,
      genre_albums: albumsInGenre,
    });
    return;
  } else {
    // Genre has no books. Delete object and redirect to the list of genres.
    await Genre.findByIdAndRemove(genre.id);
    res.redirect('/genres');
  }
});
