class PackageProcess {

    packages: any;

    constructor() {
        this.packages = [];
    }
    
    public Process(_this) {
        console.log(111, 'PackageProcess.Process');
    }

    public add(p) {
        console.log(114, 'User.addPackage', p);
        this.packages.push(p);
        //if (this.packages.length)
            //this.Process();
            //setTimeout()
    }
}

export default PackageProcess;