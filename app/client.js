const $ = id => document.getElementById(id);
let editingId;
async function api(path, method = 'GET', data) {
  const response = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}
async function refresh() {
  const { tasks } = await api('/tasks');
  const filter = $('filter').value;
  const shown = tasks.filter(t => filter === 'All' || (filter === 'Completed' ? t.done : !t.done));
  $('totalCount').textContent = tasks.length;
  $('activeCount').textContent = tasks.filter(t => !t.done).length;
  $('doneCount').textContent = tasks.filter(t => t.done).length;
  $('tasks').replaceChildren();
  $('empty').hidden = shown.length > 0;
  for (const task of shown) {
    const row = document.createElement('div');
    row.className = 'task' + (task.done ? ' done' : '');
    row.setAttribute('data-testid', 'task-row');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = task.done;
    check.setAttribute('aria-label', `Complete ${task.title}`);
    check.onchange = () => act(() => api('/tasks/' + task.id, 'PATCH', { done: check.checked }));
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = task.title;
    const edit = document.createElement('button');
    edit.textContent = 'Edit';
    edit.className = 'secondary';
    edit.onclick = () => { editingId = task.id; $('editTitle').value = task.title; $('editDialog').showModal(); };
    const remove = document.createElement('button');
    remove.textContent = 'Delete';
    remove.className = 'danger';
    remove.onclick = () => act(() => api('/tasks/' + task.id, 'DELETE'));
    row.append(check, title, edit, remove);
    $('tasks').append(row);
  }
}
async function act(action) {
  try { $('taskError').textContent = ''; await action(); await refresh(); }
  catch (error) { $('taskError').textContent = error.message; }
}
async function enter() {
  const me = await api('/me');
  $('identity').textContent = me.email;
  $('auth').hidden = true;
  $('workspace').hidden = false;
  $('filter').value = 'All';
  $('title').value = '';
  $('taskError').textContent = '';
  await refresh();
}
$('loginForm').onsubmit = async event => {
  event.preventDefault();
  try {
    await api('/login', 'POST', { email: $('email').value, password: $('password').value });
    $('authError').textContent = '';
    await enter();
  } catch (error) { $('authError').textContent = error.message; }
};
$('register').onclick = async () => {
  try {
    const data = { email: $('email').value, password: $('password').value };
    await api('/register', 'POST', data);
    await api('/login', 'POST', data);
    $('authError').textContent = '';
    await enter();
  } catch (error) { $('authError').textContent = error.message; }
};
$('logout').onclick = async () => {
  try {
    await api('/logout', 'POST');
    $('workspace').hidden = true;
    $('auth').hidden = false;
    $('password').value = '';
    $('tasks').replaceChildren();
  } catch (error) { $('taskError').textContent = error.message; }
};
$('taskForm').onsubmit = event => {
  event.preventDefault();
  act(async () => { await api('/tasks', 'POST', { title: $('title').value }); $('title').value = ''; });
};
$('filter').onchange = () => act(async () => {});
$('cancelEdit').onclick = () => $('editDialog').close();
$('editForm').onsubmit = event => {
  event.preventDefault();
  act(async () => {
    await api('/tasks/' + editingId, 'PATCH', { title: $('editTitle').value });
    $('editDialog').close();
  });
};
try { await enter(); } catch { /* An anonymous visitor starts on the sign-in screen. */ }
