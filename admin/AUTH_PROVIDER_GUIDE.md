# Auth Provider Implementation Guide

## Overview

The `AuthContext` and `AuthProvider` replace the old `withAuth` HOC with a modern React Context API approach. This provides a centralized authentication system with built-in functions for login, data fetching, updates, and resource creation.

## Files Created/Modified

1. **[src/context/AuthContext.jsx](src/context/AuthContext.jsx)** - New Auth Context Provider with all admin functions
2. **[src/app/layout.js](src/app/layout.js)** - Updated to wrap app with AuthProvider
3. **[src/components/withAuth.js](src/components/withAuth.js)** - Updated to use AuthProvider
4. **[src/app/login/page.js](src/app/login/page.js)** - Updated to use useAuth hook

## Features

### Authentication Functions

#### `login(email, password)`
```javascript
const { login } = useAuth();
try {
  const response = await login('admin@example.com', 'password');
  // User is now authenticated
} catch (error) {
  console.error(error.message);
}
```

#### `logout()`
```javascript
const { logout } = useAuth();
logout(); // Clears auth state and redirects to login
```

### Data Functions

#### `getData(type, ...args)`
Fetch any type of data with a unified interface:

```javascript
const { getData } = useAuth();

// Fetch members (with pagination)
const members = await getData('members', page, limit);

// Fetch specific member
const member = await getData('member', memberId);

// Fetch payments for a user
const payments = await getData('payments', userId);

// Fetch all payments
const allPayments = await getData('payments');

// Fetch agents
const agents = await getData('agents');
```

### Update Functions

#### `update(type, id, payload)`
Update any type of resource:

```javascript
const { update } = useAuth();

// Update member
const updated = await update('member', memberId, {
  name: 'New Name',
  email: 'newemail@example.com'
});

// Update agent
const updated = await update('agent', agentId, {
  status: 'active',
  commission: 5
});
```

### Create Functions

#### `create(type, payload)`
Create new resources:

```javascript
const { create } = useAuth();

// Create new agent
const newAgent = await create('agent', {
  name: 'Agent Name',
  email: 'agent@example.com',
  commission: 5
});
```

### Delete Functions

#### `delete(type, id)`
Delete resources:

```javascript
const { delete: deleteResource } = useAuth();

// Delete member
await deleteResource('member', memberId);
```

## Usage in Components

### Using the useAuth Hook

```javascript
"use client";
import { useAuth } from "@/context/AuthContext";

export default function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    error,
    login,
    logout,
    getData,
    update,
    create,
    delete: deleteResource
  } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {user.uid}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Using the withAuth HOC

The old `withAuth` HOC still works, but now uses the AuthProvider internally:

```javascript
"use client";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/context/AuthContext";

function Dashboard() {
  const { getData, user } = useAuth();
  
  // Component automatically has auth protection
  return <div>Dashboard for {user.uid}</div>;
}

export default withAuth(Dashboard);
```

### Example: Members Page

```javascript
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import withAuth from "@/components/withAuth";

function MembersPage() {
  const { getData, update, delete: deleteResource, error } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await getData('members', 1, 10);
      setMembers(data.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await update('member', id, updates);
      await loadMembers(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteResource('member', id);
      await loadMembers(); // Refresh list
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      {/* Render members list */}
    </div>
  );
}

export default withAuth(MembersPage);
```

### Example: Agents Page with Create

```javascript
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AgentsPage() {
  const { getData, create, update, error } = useAuth();
  const [agents, setAgents] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await getData('agents');
      setAgents(data.agents || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAgent = async (formData) => {
    setIsCreating(true);
    try {
      await create('agent', formData);
      await loadAgents(); // Refresh list
      // Show success message
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      {error && <p className="text-red-600">{error}</p>}
      <button onClick={() => handleCreateAgent({ name: 'New Agent' })}>
        {isCreating ? 'Creating...' : 'Create Agent'}
      </button>
      {/* Render agents list */}
    </div>
  );
}
```

## Context Values

The `useAuth()` hook returns an object with:

| Property | Type | Description |
|----------|------|-------------|
| `user` | `object \| null` | Current logged-in user object |
| `isAuthenticated` | `boolean` | Whether user is logged in |
| `loading` | `boolean` | Whether auth state is being checked |
| `error` | `string \| null` | Last error message |
| `login` | `function` | Login function |
| `logout` | `function` | Logout function |
| `getData` | `function` | Fetch data function |
| `update` | `function` | Update resource function |
| `create` | `function` | Create resource function |
| `delete` | `function` | Delete resource function |

## Supported Data Types

### getData
- `'members'` - Get paginated members list (args: page, limit)
- `'member'` - Get single member (args: id)
- `'payments'` - Get payments (args: userId or no args for all)
- `'agents'` - Get all agents

### update
- `'member'` - Update member (args: id, payload)
- `'agent'` - Update agent (args: id, payload)

### create
- `'agent'` - Create new agent (args: payload)

### delete
- `'member'` - Delete member (args: id)

## Migration from Old withAuth

**Old way:**
```javascript
import withAuth from "@/components/withAuth";
import { getMembers } from "@/lib/api";

function Dashboard() {
  useEffect(() => {
    getMembers(1, 10).then(setMembers);
  }, []);
  
  return <div>{members.length} members</div>;
}

export default withAuth(Dashboard);
```

**New way:**
```javascript
import withAuth from "@/components/withAuth";
import { useAuth } from "@/context/AuthContext";

function Dashboard() {
  const { getData } = useAuth();
  
  useEffect(() => {
    getData('members', 1, 10).then(setMembers);
  }, []);
  
  return <div>{members.length} members</div>;
}

export default withAuth(Dashboard);
```

The main difference is using `useAuth()` hook instead of importing individual API functions, which provides a unified interface and automatic error handling through the context.
