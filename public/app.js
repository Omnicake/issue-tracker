let deleteButtons = document.querySelectorAll('.delete');

let deleteForm = document.getElementById('deleteForm');

deleteButtons.forEach(el => {
    el.addEventListener("click", () => {
        deleteForm.action = `/issues/${el.id}?_method=DELETE`;
    });
});

$(function () {
  $('[data-toggle="popover"]').popover()
})