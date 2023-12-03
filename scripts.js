// Sample data (initially empty, will be populated after fetching from the API)
let users = [];
let messages = [];

const rowsPerPage = 10;
let currentPage = 1;
let selectedRows = [];

// Function to load users from localStorage
function loadUsersFromStorage() {
    const storedUsers = localStorage.getItem('users');
    return storedUsers ? JSON.parse(storedUsers) : [];
}

// Function to save users to localStorage
function saveUsersToStorage(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Function to load messages from localStorage
function loadMessagesFromStorage() {
    const storedMessages = localStorage.getItem('messages');
    return storedMessages ? JSON.parse(storedMessages) : [];
}

// Function to save messages to localStorage
function saveMessagesToStorage(messages) {
    localStorage.setItem('messages', JSON.stringify(messages));
}

// Function to render users on the current page
function renderUsers() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const displayedUsers = users.slice(start, end);

    const tableBody = $('#userTableBody');
    tableBody.empty();

    displayedUsers.forEach(user => {
        const row = $('<tr>').appendTo(tableBody);
        const isSelected = selectedRows.includes(user.id);
        $('<td>').html(`<input type="checkbox" class="select-row" data-id="${user.id}" ${isSelected ? 'checked' : ''}>`).appendTo(row);
        $('<td>').text(user.id).appendTo(row);
        $('<td>').html(`<div class="editable" contenteditable="${isSelected ? 'true' : 'false'}" data-field="name">${user.name}</div>`).appendTo(row);
        $('<td>').html(`<div class="editable" contenteditable="${isSelected ? 'true' : 'false'}" data-field="email">${user.email}</div>`).appendTo(row);
        $('<td>').html(`<button class="btn btn-primary edit">Edit</button> <button class="btn btn-danger delete">Delete</button>`).appendTo(row);

        // Add grayish background for selected rows
        if (isSelected) {
            row.addClass('selected-row');
        }
    });

    updatePagination();
    saveUsersToStorage(users);
}

// Function to update pagination buttons
function updatePagination() {
    const totalPages = Math.ceil(users.length / rowsPerPage);
    const pagination = $('#pagination');
    pagination.text(`Page ${currentPage} of ${totalPages}`);

    $('.pagination-container button').prop('disabled', false);

    if (currentPage === 1) {
        $('.first-page, .previous-page').prop('disabled', true);
    }

    if (currentPage === totalPages) {
        $('.next-page, .last-page').prop('disabled', true);
    }
}

// Event listener for search
$('#search').on('input', function () {
    const searchTerm = $(this).val().toLowerCase();
    const filteredUsers = users.filter(user =>
        Object.values(user).some(value => value.toString().toLowerCase().includes(searchTerm))
    );

    currentPage = 1;
    users.length = 0;
    users.push(...filteredUsers);
    renderUsers();
});

// Event listener for select/deselect all checkbox
$('#selectAll').on('change', function () {
    const isChecked = $(this).prop('checked');
    $('.select-row').prop('checked', isChecked);

    // Update selectedRows based on the checked status
    if (isChecked) {
        selectedRows = users.map(user => user.id);
    } else {
        selectedRows = [];
    }

    renderUsers();
});

// Event listener for save button
$(document).on('click', '.edit', function () {
    const row = $(this).closest('tr');
    const editableCells = row.find('.editable');

    if (editableCells.attr('contenteditable') === 'true') {
        editableCells.attr('contenteditable', 'false');
        $(this).text('Edit');

        // Save the changes to localStorage
        const userId = parseInt(row.find('.select-row').data('id'));
        
        const userIndex = users.findIndex(user => user.id == userId);
        
        if (userIndex !== -1) {
            users[userIndex].name = editableCells.filter('[data-field="name"]').text().trim();
            users[userIndex].email = editableCells.filter('[data-field="email"]').text().trim();
            console.log(users[userIndex]);
            saveUsersToStorage(users);
        }
    } else {
        editableCells.attr('contenteditable', 'true');
        editableCells.first().focus();
        $(this).text('Save');
    }
});

// Event listener for delete button
$(document).on('click', '.delete', function () {
    const row = $(this).closest('tr');
    const userId = parseInt(row.find('.select-row').data('id'));

    // Remove the user from the array in memory
    users = users.filter(user => user.id != userId);

    // Remove the row from the table
    row.remove();

    saveUsersToStorage(users);

    // Clear selectedRows and update pagination
    selectedRows = [];
    updatePagination();
});

// Event listener for pagination buttons
$('.pagination-container button').on('click', function () {
    const action = $(this).attr('class');
    switch (action) {
        case 'btn btn-primary first-page':
            currentPage = 1;
            break;
        case 'btn btn-primary previous-page':
            currentPage = Math.max(currentPage - 1, 1);
            break;
        case 'btn btn-primary next-page':
            const totalPages = Math.ceil(users.length / rowsPerPage);
            currentPage = Math.min(currentPage + 1, totalPages);
            break;
        case 'btn btn-primary last-page':
            currentPage = Math.ceil(users.length / rowsPerPage);
            break;
    }
    renderUsers();
});

// Event listener for bulk delete
$('#bulkDeleteBtn').on('click', function () {
    // Filter users to exclude the selected rows
    users = users.filter(user => !selectedRows.includes(user.id));

    // Remove selected rows from the table
    $('.select-row:checked').closest('tr').remove();

    // Clear selectedRows and update pagination
    selectedRows = [];
    updatePagination();
});

// Initial render (will be updated after fetching data from the API)
renderUsers();

// Fetch data from the provided API endpoint for users
fetch('https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json')
    .then(response => response.json())
    .then(data => {
        // Assuming data is an array of user objects
        users = loadUsersFromStorage() || data;
        renderUsers();
    })
    .catch(error => console.error('Error fetching data:', error));