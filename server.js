const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// ✅ CORS Configuration
app.use(cors({
  origin: "https://loan-pro1.vercel.app",
  credentials: true
}));


app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ MongoDB Connection with Correct Configuration
const MONGODB_URI = process.env.MONGODB_URI ||
    "mongodb+srv://aravindhvinayagam2007_db_user:RXGSMWjV3lSxBjHH@loancluster.xhvqvbf.mongodb.net/loanDB?retryWrites=true&w=majority";

// Correct MongoDB connection options
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    maxPoolSize: 10,
    minPoolSize: 1
})
.then(() => {
    console.log('✅ MongoDB Connected Successfully to Atlas Cluster');
    // Initialize data after successful connection
    initializeOwner();
    initializeSampleData();
})
.catch(err => {
    console.log('❌ MongoDB connection error:', err.message);
    console.log('💡 Check your MongoDB Atlas network access and credentials');
});

// ✅ Schemas
const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    profilePicture: { type: String, default: '' },
    loanStartDate: { type: String, required: true },
    totalLoanAmount: { type: Number, required: true },
    dailyPayment: { type: Number, required: true },
    payments: [{
        date: String,
        amount: Number,
        interest: Number,
        principal: Number
    }],
    penaltyApplied: { type: Boolean, default: false },
    status: { type: String, default: 'active' }
}, { timestamps: true });

const ownerSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
const Owner = mongoose.model('Owner', ownerSchema);

// ✅ Initialize Owner Account with Better Error Handling
async function initializeOwner() {
    try {
        console.log('🔄 Checking owner account...');
        
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));

        const existingOwner = await Owner.findOne({ email: 'owner@loanpro.com' });
        if (!existingOwner) {
            console.log('👤 Creating owner account...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const owner = new Owner({ 
                email: 'owner@loanpro.com', 
                password: hashedPassword 
            });
            await owner.save();
            console.log('✅ Owner account created successfully');
        } else {
            console.log('✅ Owner account already exists');
        }
    } catch (error) {
        console.log('❌ Error in owner account setup:', error.message);
        // Don't retry immediately, just log the error
    }
}

// ✅ Initialize Sample Data
async function initializeSampleData() {
    try {
        console.log('🔄 Checking sample data...');
        
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));

        const count = await Customer.countDocuments();
        if (count === 0) {
            console.log('📝 Creating sample customer data...');
            const sampleCustomers = [
                {
                    name: "Rajesh Kumar",
                    phone: "9876543210",
                    address: "123 Main Street, Chennai, Tamil Nadu - 600001",
                    profilePicture: "https://randomuser.me/api/portraits/men/32.jpg",
                    loanStartDate: "2023-01-15",
                    totalLoanAmount: 50000,
                    dailyPayment: 500,
                    payments: [
                        { date: "2023-01-16", amount: 500, interest: 50, principal: 450 },
                        { date: "2023-01-17", amount: 500, interest: 50, principal: 450 }
                    ]
                },
                {
                    name: "Priya Sharma",
                    phone: "8765432109",
                    address: "456 Oak Avenue, Mumbai, Maharashtra - 400001",
                    profilePicture: "https://randomuser.me/api/portraits/women/44.jpg",
                    loanStartDate: "2023-02-10",
                    totalLoanAmount: 75000,
                    dailyPayment: 750,
                    payments: [
                        { date: "2023-02-11", amount: 750, interest: 75, principal: 675 }
                    ]
                }
            ];
            await Customer.insertMany(sampleCustomers);
            console.log('✅ Sample customer data created successfully');
        } else {
            console.log('✅ Sample data already exists');
        }
    } catch (error) {
        console.log('❌ Error in sample data setup:', error.message);
        // Don't retry immediately, just log the error
    }
}



// ✅ Function to check and update loan status
async function updateLoanStatus(customer) {
    try {
        const totalPaid = customer.payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        if (totalPaid >= customer.totalLoanAmount && customer.status === 'active') {
            customer.status = 'deactivated';
            await customer.save();
            console.log(`✅ Loan deactivated for ${customer.name}`);
        }
        
        return customer;
    } catch (error) {
        console.error('Error updating loan status:', error);
        return customer;
    }
}

// ✅ Health Check
app.get("/api/health", (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
    res.json({ 
        status: "OK", 
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// ✅ Enhanced Health Check with Database Test
app.get("/api/health/deep", async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
        let dbTest = "Not tested";
        
        if (dbStatus === "Connected") {
            try {
                const customerCount = await Customer.countDocuments();
                dbTest = `Connected (${customerCount} customers)`;
            } catch (dbError) {
                dbTest = `Connection issue: ${dbError.message}`;
            }
        }
        
        res.json({ 
            status: "OK", 
            database: dbStatus,
            databaseTest: dbTest,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.json({ 
            status: "Error", 
            database: "Connection issue",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ✅ Simulate loading delay for testing (remove in production)
app.get('/api/customers/delayed', async (req, res) => {
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const customers = await Customer.find().sort({ createdAt: -1 });
        
        // Check and update status for all customers
        const updatedCustomers = await Promise.all(
            customers.map(async (customer) => {
                return await updateLoanStatus(customer);
            })
        );
        
        res.json(updatedCustomers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Owner Login
app.post('/api/owner/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

        const owner = await Owner.findOne({ email });
        if (!owner) return res.status(400).json({ message: 'Owner not found' });

        const isMatch = await bcrypt.compare(password, owner.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Owner login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Customer Login
app.post('/api/customer/login', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number required' });

        const customer = await Customer.findOne({ phone });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Get All Customers
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        
        // Check and update status for all customers
        const updatedCustomers = await Promise.all(
            customers.map(async (customer) => {
                return await updateLoanStatus(customer);
            })
        );
        
        res.json(updatedCustomers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Get Customer by ID
app.get('/api/customers/:id', async (req, res) => {
    try {
        let customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        
        // Check and update loan status
        customer = await updateLoanStatus(customer);
        
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Owner Add Customer
app.post('/api/owner/add-customer', async (req, res) => {
  try {
    console.log("📥 Received new customer data:", req.body);
    
    const { name, phone, address, loanStartDate, totalLoanAmount, dailyPayment } = req.body;
    
    // Validate required fields
    if (!name || !phone || !address || !loanStartDate || !totalLoanAmount) {
      return res.status(400).json({ 
        message: 'All fields are required: name, phone, address, loanStartDate, totalLoanAmount' 
      });
    }

    // Check if phone already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    const newCustomer = new Customer({
      name,
      phone,
      address,
      loanStartDate,
      totalLoanAmount,
      dailyPayment: dailyPayment || Math.round(totalLoanAmount * 0.01), // Default to 1% of loan
      payments: [],
      status: 'active'
    });

    await newCustomer.save();
    console.log("✅ Customer saved successfully:", newCustomer);
    
    res.status(201).json({ 
      message: 'Customer added successfully', 
      customer: newCustomer 
    });
  } catch (error) {
    console.error('❌ Add customer error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    res.status(500).json({ 
      message: 'Server error while adding customer',
      error: error.message 
    });
  }
});

// ✅ Add Payment Route - UPDATED (removed interest)
app.post('/api/customers/:id/payments', async (req, res) => {
    try {
        const { date, amount, principal } = req.body;
        let customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        // Create payment without interest
        customer.payments.push({ 
            date, 
            amount, 
            principal: principal || amount
        });
        
        // Check and update loan status after adding payment
        customer = await updateLoanStatus(customer);
        
        await customer.save();

        res.json({ message: 'Payment added successfully', customer });
    } catch (error) {
        console.error('Add payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Delete Customer Route
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Delete Payment Route
app.delete('/api/customers/:customerId/payments/:paymentDate', async (req, res) => {
  try {
    const { customerId, paymentDate } = req.params;
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // Remove the payment with the specified date
    customer.payments = customer.payments.filter(p => p.date !== paymentDate);
    await customer.save();

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Analytics Endpoint
app.get('/api/analytics', async (req, res) => {
    try {
        const customers = await Customer.find();
        const totalCustomers = customers.length;
        const activeLoans = customers.filter(c => c.status === 'active').length;
        const totalLoanAmount = customers.reduce((sum, c) => sum + c.totalLoanAmount, 0);
        const amountReceived = customers.reduce((sum, c) =>
            sum + c.payments.reduce((pSum, p) => pSum + p.amount, 0), 0
        );

        const monthlyData = {};
        customers.forEach(c => {
            c.payments.forEach(p => {
                const month = p.date.substring(0, 7);
                monthlyData[month] = (monthlyData[month] || 0) + p.amount;
            });
        });

        const chartData = Object.keys(monthlyData).map(month => ({ month, amount: monthlyData[month] }));
        res.json({ totalCustomers, activeLoans, totalLoanAmount, amountReceived, chartData });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// ✅ Update Customer Route - ADD THIS TO server.js
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, phone, address, loanStartDate, totalLoanAmount, dailyPayment } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update customer fields
    customer.name = name;
    customer.phone = phone;
    customer.address = address;
    customer.loanStartDate = loanStartDate;
    customer.totalLoanAmount = totalLoanAmount;
    customer.dailyPayment = dailyPayment;

    await customer.save();
    res.json({ message: 'Customer updated successfully', customer });
    
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ Serve HTML Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/owner', (req, res) => res.sendFile(path.join(__dirname, 'public', 'owner.html')));
app.get('/customer', (req, res) => res.sendFile(path.join(__dirname, 'public', 'customer.html')));

// ✅ 404 Handler
app.use('*', (req, res) => res.status(404).json({ message: 'Route not found' }));

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Deep health check: http://localhost:${PORT}/api/health/deep`);
    console.log(`👤 Owner login: email: owner@loanpro.com, password: admin123`);
});
