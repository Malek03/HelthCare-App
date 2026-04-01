const router = require('express').Router();
const { listVideos } = require('../controllers/video.controller');

router.get('/', listVideos);

module.exports = router;
