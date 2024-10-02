const Url         = require('../models/urlModel');
const redisClient = require('../redisClient'); 


const shortenUrl = async (req, res) => {
  try {
    const { longUrl } = req.body;
    const baseUrl = process.env.BASE_URL;

    if (!longUrl) {
      return res.status(400).json({ status: false, message: 'Invalid long URL' });
    }

    const cachedUrl = await redisClient.get(longUrl);
    if (cachedUrl) {
      return res.json({ status: true, data: JSON.parse(cachedUrl) });
    }

    let url = await Url.findOne({ longUrl });
    if (url) {
      await redisClient.set(longUrl, JSON.stringify(url), { EX: 86400 });
      return res.json({ status: true, data: url });
    }

    const { nanoid } = await import('nanoid');
    const urlCode    = nanoid(6); 
    const shortUrl   = `${baseUrl}/${urlCode}`;

    url = new Url({ longUrl, shortUrl, urlCode });
    await url.save();

    await redisClient.set(longUrl, JSON.stringify(url), { EX: 86400 });

    res.json({ status: true, data: { longUrl, shortUrl, urlCode } });
  } catch (error) {
    console.error('Error in shortenUrl:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};


const redirectUrl = async (req, res) => {
  try {
    const { urlCode } = req.params;

    const cachedUrl = await redisClient.get(urlCode);
    if (cachedUrl) {
      const urlData = JSON.parse(cachedUrl);
      return res.redirect(urlData.longUrl);
    }

    const url = await Url.findOne({ urlCode });
    if (url) {

      await redisClient.set(urlCode, JSON.stringify(url), { EX: 86400 });
      return res.redirect(url.longUrl);
    }

    res.status(404).json({ status: false, message: 'URL not found' });
  } catch (error) {
    console.error('Error in redirectUrl:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
};

module.exports = { shortenUrl, redirectUrl };
