// Simple login page logic
(function(){
  function getData(key){try{return JSON.parse(localStorage.getItem(key));}catch(e){return null}}
  function saveData(key,val){localStorage.setItem(key,JSON.stringify(val))}

  function seed(){
    let users = getData('users')||[];
    const defaults = [
      {username:'headmaster',password:'headmaster',role:'headmaster',name:'Headmaster'},
      {username:'teacher',password:'teacher',role:'teacher',name:'Teacher Guest'},
      {username:'JamesJulius',password:'Jam3s@Julius',role:'headmaster',name:'James Julius'}
    ];

    if(!users || users.length===0){
      users = defaults.map((d,i)=> ({ id: 'U'+String(i+1).padStart(3,'0'), ...d }));
      saveData('users',users);
      return;
    }

    // Ensure each default user exists (add if missing)
    let changed = false;
    defaults.forEach(def => {
      if(!users.find(u => u.username === def.username)){
        const id = 'U'+String(users.length+1).padStart(3,'0');
        users.push({id, ...def});
        changed = true;
      }
    });
    if(changed) saveData('users',users);
  }

  function findUser(username,password){
    const users = getData('users')||[];
    return users.find(u=>u.username===username && u.password===password) || null;
  }

  function login(username,password){
    const user = findUser(username,password);
    if(!user){alert('Invalid credentials');return}
    // set current user and redirect to dashboard
    saveData('currentUser',user);
    // Redirect based on role
    if(user.role === 'teacher') {
      window.location.href = 'teacher.html';
    } else {
      window.location.href = 'index.html';
    }
  }


  // UI wiring
  document.addEventListener('DOMContentLoaded',()=>{
    seed();
    document.getElementById('btnLogin').addEventListener('click',()=>{
      const u=document.getElementById('loginUser').value.trim();
      const p=document.getElementById('loginPass').value;
      login(u,p);
    });
      const tBtn = document.getElementById('btnTeacherLogin');
      if(tBtn){
        tBtn.addEventListener('click', ()=>{
          // Prompt for credentials to authenticate a teacher account
          const u = prompt('Teacher username:');
          if (!u) return;
          const p = prompt('Password:');
          if (p === null) return; // cancelled
          // Use existing login flow which redirects based on role
          login(u.trim(), p);
        });
      }
  });
})();
