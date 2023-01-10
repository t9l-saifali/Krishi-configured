let substract530 = (date) => {
    let date1 = new Date(date);
    date1.setHours(date1.getHours() - 5);
    date1.setMinutes(date1.getMinutes() - 30);
    return date1;
}

module.exports.substract530 = (req, res, next) => {
	Object.keys(req.body).forEach(key =>{

		if(isNaN(+req.body[key])){

			if(!isNaN(Date.parse(req.body[key]))){
				console.log('before', req.body[key])
				req.body[key] = substract530(req.body[key])
				console.log('after', req.body[key])
			}
		}
	})
	next()
}