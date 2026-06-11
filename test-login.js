const axios = require('axios');

async function testLogin() {
  const email = 'test@example.com';
  const password = 'Test123!@#';

  console.log('Testing login with:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('API URL:', 'http://localhost:3001/api/auth/login');
  console.log('\n---\n');

  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('ERROR!');
    console.log('Status:', error.response?.status);
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error message:', error.message);
  }
}

testLogin();
