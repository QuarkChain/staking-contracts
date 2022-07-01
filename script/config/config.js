const YAML = require("yaml");
const fs = require("fs");



class Config{

    constructor(){
        try {
            let path = "./deploy_config.yaml"
            let context = fs.readFileSync(path,'utf-8');
            let config = YAML.parse(context);
            console.log(config)
            this.FilePath = path
            this.Staking = config.Staking
            this.W3Q = config.W3Q
            this.LightClient = config.LightClient   
        } catch (error) {
            throw error
        }
    }

    getLightClientParams(){
        return this.LightClient.params
    }

    getW3Q(){
        return this.W3Q
    }



    getStakingParams() {
        return this.Staking.params
    }

    setStakingAddress(addr) {
        this.Staking.address = addr
        this.LightClient.params.staking = addr
    }

    setStakingOwner(owner) {
        this.Staking.owner = owner
    }

    setStakingParams(params) {
        this.Staking.params = params
    }

    setW3Q(w3q) {
        this.W3Q = w3q
        this.Staking.params.w3qAddress = w3q.address
    }

    setLightClientParams(params){
        this.LightClient.params = params
    }

    save() {
        try {
            fs.writeFileSync(this.FilePath,YAML.stringify(this))
        } catch (error) {
            console.error(error)
        }
    }
}

exports.Config = Config