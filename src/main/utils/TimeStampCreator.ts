export class TimeStampCreator {

    static createTimeStamp() {
        var today = new Date();
    
        var day = (today.getDate() < 10 ? "0" : "") + today.getDate();
        var month = (today.getMonth()+1 < 10 ? "0" : "") + (today.getMonth() + 1);
        var year = today.getFullYear();
        var date = day + '-' + month + '-' + year;
    
        var hours = (today.getHours() < 10 ? "0" : "") + today.getHours();
        var minutes = (today.getMinutes() < 10 ? "0" : "") + today.getMinutes();
        var seconds = (today.getSeconds() < 10 ? "0" : "") + today.getSeconds();
        var time = hours + "-" + minutes + "-" + seconds;

        return date + ' ' + time;
    }
}