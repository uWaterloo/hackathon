var hackathonDate = new Date("03/12/2016");



function getData() {
    var queryResult = db.Execute('SELECT t2.id, t1.upCount, t1.voted, t2.title, t2.description FROM (SELECT COUNT(*) as upCount, t0.id, max(case when t0.userId=@currentUser then 1 else 0 end) as voted FROM (SELECT a.id,\
       a.title,\
       a.description,\
       a.dateApproved,\
	   b.id as upId,\
	   b.userId\
    FROM   ideas AS a\
    INNER JOIN\
    ups AS b\
    ON a.id = b.ideaId\
    WHERE  a.visible = 1) AS t0\
    GROUP BY t0.id) as t1\
    FULL OUTER JOIN ideas as t2\
    on t1.id = t2.id WHERE t2.visible = 1');
    var rows = JSON.parse(queryResult);
    if (rows.length > 0 && typeof rows[0].Error != 'undefined') {
        createTable();
        return '[]';
    } 
    return queryResult;
}

function hackathonDateData() {
    createTable();
    var now = new Date();
    var dDiff = Math.ceil((hackathonDate - now) / 1000 / 60 / 60 / 24);
    return JSON.stringify({ 'date': hackathonDate.toString(), 'daysRemaining':dDiff});
}

function up() {
    var rows = JSON.parse(db.Execute('SELECT * FROM ups WHERE userId = @currentUser AND id=@id'));
    if (rows.length > 0)
        return JSON.stringify(false);
    else {
        db.Execute('INSERT INTO ups (userId, ideaId) VALUES (@currentUser,@id)');
        return JSON.stringify(true);
    }
}

function createTable() {
    var result = {};

    var queryResult = db.Execute('SELECT TOP 1 * FROM ideas');
    var row = JSON.parse(queryResult);

    if (row.length > 0 && typeof row[0].Error != 'undefined') {
        db.Execute('CREATE TABLE ideas(id INTEGER PRIMARY KEY IDENTITY(1,1), userId nvarchar(50), title nvarchar(200), \
                   description nvarchar(500), upCount integer, visible bit, dateApproved DATETIME null);');
        db.Execute('CREATE TABLE ups (id INTEGER PRIMARY KEY IDENTITY(1,1),  userId nvarchar(50), ideaId integer, CONSTRAINT hackathon_ups_ideas FOREIGN KEY(ideaId) REFERENCES ideas(id));');
        result = '{"status":"tableCreated"}';
    } else
        result = '{"status":"tableExist"}';

    return result;
}

function addIdea() {
    if (args.Get("description").length > 500)
        return '"false"';
    else {
        db.Execute('INSERT INTO ideas VALUES(@currentUser,\'\', @description, 0, 0, null)');
        return '"true"';
    }
}

function addFeedback() {
    var tryGet = JSON.parse(db.Execute('SELECT TOP 1 * FROM feedback'));
    if (tryGet.length > 0 && typeof tryGet[0].Error != 'undefined') {
        db.Execute('CREATE TABLE feedback (id INTEGER PRIMARY KEY IDENTITY(1,1), userId nvarchar(50), feedback nvarchar(1000), category nvarchar(200))')
    };

    if (args.Get("feedback").length > 1000)
        return '"false"';
    else {
        db.Execute('INSERT INTO feedback VALUES(@currentUser, @feedback, @category)');
        return '"true"';
    }
}
