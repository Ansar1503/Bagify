# Bagfy E-commerce Platform

Bagfy is a full-featured E-commerce platform designed to provide a seamless online shopping experience. The project implements essential user-facing features such as product browsing, cart management, checkout, and payment processing, alongside a robust admin dashboard for managing products, orders, users, and inventory.

## Features

### User Side
- **User Authentication**: 
  - Sign up and login with validations.
  - OTP-based signup with timer and resend functionality.
  - Social login via Google and Facebook.
  
- **Product Catalog**:
  - List of products with detailed views including product images with zoom, breadcrumbs, ratings, price, reviews, and stock availability.
  - Related product recommendations.
  - Filter and sorting options (Price, Ratings, Popularity, New Arrivals, etc.).

- **Cart & Checkout**:
  - Add to cart functionality with stock control and maximum quantity limits.
  - Cart management: add, remove, and view products.
  - Multiple shipping addresses, address management, and saved address selection at checkout.
  - Order placement with Cash on Delivery (COD) for eligible orders and integrated payment gateways (Razorpay/PayPal).
  - Download invoices in PDF format.

- **Order Management**:
  - View order history, status tracking, and cancellation options.
  - Error handling for failed payments, with the ability to retry from the order page.

- **Additional Features**:
  - Coupon management: apply and remove coupons during checkout.
  - Wishlist functionality: add and remove products.
  - Wallet feature for refunds on canceled orders.

### Admin Side
- **Admin Dashboard**:
  - View sales reports and generate downloadable PDF reports.
  - Best selling products, categories, and brands analytics.
  - Yearly and monthly sales statistics.

- **Product & Inventory Management**:
  - Add, edit, and delete products with multiple image uploads (automatically cropped and resized).
  - Manage inventory and stock levels.
  
- **Order & User Management**:
  - View, manage, and update order statuses.
  - Handle user management: block/unblock users.
  
- **Coupon Management**: 
  - Create and delete coupons for promotional offers.

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript (EJS)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Payment Integration**: Razorpay

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Ansar1503/Bagify.git
