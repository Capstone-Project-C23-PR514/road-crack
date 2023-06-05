require('dotenv').config()

const jwt = require('jsonwebtoken')
const User = require('../models/users')

const authenticateJWT = async (req, res, next) => {
  try {
    const token = req.headers.authorization

    if (token) {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const userId = decodedToken.id

      const user = await User.findOne({ where: { id: userId } })

      if (!user) {
        return res.status(401).json({ error: 'Pengguna tidak ditemukan' })
      }

      req.user = user;
      next()
    } else {
      res.status(401).json({ error: 'Token tidak tersedia' })
    }
  } catch (err) {
    res.status(403).json({ error: 'Token tidak valid' })
  }
}

module.exports = authenticateJWT;