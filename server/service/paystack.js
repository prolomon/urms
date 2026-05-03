
export const createCustomer = async (email, firstName, lastName, phone) => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return {
      status: false,
      message: 'PAYSTACK_SECRET_KEY is not configured',
      data: null,
    };
  }

  const url = 'https://api.paystack.co/customer';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.status) {
      return {
        status: false,
        message: data?.message || `Paystack request failed with status ${response.status}`,
        data: data?.data || null,
      };
    }

    return data;
  } catch (error) {
    return {
      status: false,
      message: error?.message || 'Unable to reach Paystack',
      data: null,
    };
  }
};

export const createAccount = async (customerCode) => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return {
      status: false,
      message: 'PAYSTACK_SECRET_KEY is not configured',
      data: null,
    };
  }

  const url = 'https://api.paystack.co/dedicated_account';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: customerCode,
        // preferred_bank: 'wema-bank',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.status) {
      return {
        status: false,
        message: data?.message || `Paystack request failed with status ${response.status}`,
        data: data?.data || null,
      };
    }

    return data;
  } catch (error) {
    return {
      status: false,
      message: error?.message || 'Unable to reach Paystack',
      data: null,
    };
  }
};

export const validateCustomerOwnership = async (customerCode, bvn, type = 'bvn') => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return {
      status: false,
      message: 'PAYSTACK_SECRET_KEY is not configured',
      data: null,
    };
  }

  if (!customerCode) {
    return {
      status: false,
      message: 'customerCode is required for KYC attachment',
      data: null,
    };
  }

  const url = `https://api.paystack.co/customer/${encodeURIComponent(customerCode)}/identification`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: 'NG',
        type: String(type || 'bvn').toLowerCase(),
        value: bvn,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.status) {
      return {
        status: false,
        message: data?.message || `Paystack request failed with status ${response.status}`,
        data: data?.data || null,
      };
    }

    return data;
  } catch (error) {
    return {
      status: false,
      message: error?.message || 'Unable to reach Paystack',
      data: null,
    };
  }
};

export const initiateTransfer = async (amount, recipientCode, reason = 'User wallet payout') => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return {
      status: false,
      message: 'PAYSTACK_SECRET_KEY is not configured',
      data: null,
    };
  }

  const url = 'https://api.paystack.co/transfer';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(Number(amount) * 100),
        recipient: recipientCode,
        reason,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.status) {
      return {
        status: false,
        message: data?.message || `Paystack request failed with status ${response.status}`,
        data: data?.data || null,
      };
    }

    return data;
  } catch (error) {
    return {
      status: false,
      message: error?.message || 'Unable to reach Paystack',
      data: null,
    };
  }
};

export const createRecipient = async (name, accountNumber, bankCode, currency = 'NGN') => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return {
      status: false,
      message: 'PAYSTACK_SECRET_KEY is not configured',
      data: null,
    };
  }

  const url = 'https://api.paystack.co/transferrecipient';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.status) {
      return {
        status: false,
        message: data?.message || `Paystack request failed with status ${response.status}`,
        data: data?.data || null,
      };
    }

    return data;
  } catch (error) {
    return {
      status: false,
      message: error?.message || 'Unable to reach Paystack',
      data: null,
    };
  }
};

export const resolveBankAccount = async (accountNumber, bankCode) => {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return {
      status: false,
      message: 'PAYSTACK_SECRET_KEY is not configured',
      data: null,
    };
  }

  const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || !data?.status) {
      return {
        status: false,
        message: data?.message || `Paystack request failed with status ${response.status}`,
        data: data?.data || null,
      };
    }

    return data;
  } catch (error) {
    return {
      status: false,
      message: error?.message || 'Unable to reach Paystack',
      data: null,
    };
  }
};