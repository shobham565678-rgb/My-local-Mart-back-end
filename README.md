<<<<<<< HEAD
# My-local-Mart-back-end
=======
# MyLocalMart - Neighborhood Shop Marketplace

A React Native (Expo) application that connects local stores with customers in their neighborhood.

## Features

### For Customers
- Phone-based OTP authentication
- Discover nearby stores
- Browse products by category
- Search products globally
- Shopping cart with persistent storage
- COD payment checkout
- Order tracking

### For Store Owners
- Store dashboard with analytics
- Product management with image upload
- Inventory tracking
- Order management
- Store configuration

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT + OTP
- **Image Storage**: Cloudinary
- **State Management**: Context API + AsyncStorage
- **Navigation**: React Navigation

## Project Structure

```
mylocalmart/
├── mobile/          # React Native Expo app
├── backend/         # Node.js + Express API
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- MongoDB Atlas account
- Cloudinary account (for image uploads)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `mobile/.env.example` to `mobile/.env`
   - Fill in your MongoDB and Cloudinary credentials

4. Start the development servers:
   ```bash
   npm run dev
   ```

### Environment Variables

#### Backend (.env)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mylocalmart
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=3000
```

#### Mobile (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/logout` - Logout user

### Stores
- `GET /api/stores` - Get nearby stores
- `GET /api/stores/:id` - Get store details
- `PUT /api/stores/:id` - Update store details

### Products
- `GET /api/products` - Get products with filters
- `POST /api/products` - Create product (store owners)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Cart & Orders
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/checkout` - Checkout cart
- `GET /api/orders` - Get user orders

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License



>>>>>>> 64b9f04 (Initial commit)
