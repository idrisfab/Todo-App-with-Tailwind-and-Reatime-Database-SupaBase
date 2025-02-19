import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from './supabase';

function App() {
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const session = supabase.auth.getSession();
        setUser(session?.user ?? null);
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user;
            setUser(currentUser ?? null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (user) {
            fetchTodos();
        }
    }, [user]);

    const fetchTodos = async () => {
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .order('id', { ascending: true });
        if (error) console.log('Error fetching todos:', error);
        else setTodos(data);
    };

    const addTodo = async () => {
        if (newTodo.trim() !== '') {
            const { data, error } = await supabase
                .from('todos')
                .insert({ text: newTodo, user_id: user.id })
                .select();
            if (error) console.log('Error adding todo:', error);
            else {
                setTodos([...todos, data[0]]);
                setNewTodo('');
            }
        }
    };

    const toggleTodo = async (id, completed) => {
        const { error } = await supabase
            .from('todos')
            .update({ completed: !completed })
            .eq('id', id);
        if (error) console.log('Error updating todo:', error);
        else {
            const updatedTodos = todos.map(todo =>
                todo.id === id ? { ...todo, completed: !completed } : todo
            );
            setTodos(updatedTodos);
        }
    };

    const deleteTodo = async (id) => {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);
        if (error) console.log('Error deleting todo:', error);
        else {
            const updatedTodos = todos.filter(todo => todo.id !== id);
            setTodos(updatedTodos);
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(todos);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setTodos(items);

        // Update the order in Supabase
        const updates = items.map((item, index) => ({
            id: item.id,
            order: index,
        }));

        const { error } = await supabase.from('todos').upsert(updates);
        if (error) console.log('Error updating todo order:', error);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signInWithPassword({
            email: username,
            password: password,
        });
        if (error) alert(error.message);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.signUp({
            email: username,
            password: password,
        });
        if (error) alert(error.message);
        else alert('Check your email for the confirmation link!');
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.log('Error logging out:', error);
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Username
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="username"
                            type="email"
                            placeholder="Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            id="password"
                            type="password"
                            placeholder="******************"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="submit"
                        >
                            Sign In
                        </button>
                        <button
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="button"
                            onClick={handleSignUp}
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} transition-colors duration-300`}>
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="flex justify-between w-full max-w-md mb-6">
                    <h1 className="text-3xl font-bold ">Todo App</h1>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300"
                    >
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                </div>
                <div className="flex mb-4 w-full max-w-md">
                    <input
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 mr-2 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Add a new todo"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                    />
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={addTodo}
                    >
                        Add
                    </button>
                </div>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="todos">
                        {(provided) => (
                            <ul className="w-full max-w-md" {...provided.droppableProps} ref={provided.innerRef}>
                                {todos.map((todo, index) => (
                                    <Draggable key={todo.id} draggableId={String(todo.id)} index={index}>
                                        {(provided) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={`flex justify-between items-center bg-white dark:bg-gray-700 shadow rounded p-3 mb-2`}
                                            >
                                                <span
                                                    className={`flex-1 cursor-pointer ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}
                                                    onClick={() => toggleTodo(todo.id, todo.completed)}
                                                >
                                                    {todo.text}
                                                </span>
                                                <button
                                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline ml-2"
                                                    onClick={() => deleteTodo(todo.id)}
                                                >
                                                    Delete
                                                </button>
                                            </li>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
                <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

export default App;
