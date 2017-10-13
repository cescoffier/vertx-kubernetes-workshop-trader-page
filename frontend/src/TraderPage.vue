<style scoped>
    .trader {
        padding: 30px;
        font-size: 18px;
    }
</style>
<template>
    <div class="trader">
        <div class="row">
            <!-- portfolio -->
            <div class="col-md-6">
                <div class="block">
                    <h2>Portfolio</h2>
                    <dl class="dl-horizontal">
                        <dt>Cash</dt>
                        <dd id="cash">{{ getCash | currency }}</dd>
                        <dt>Value</dt>
                        <dd id="value">{{ getValue | currency }}</dd>
                        <dt>Total Value</dt>
                        <dd id="total">{{ getTotalValue | currency }}</dd>
                        <dt>Divinator</dt>
                        <dd>{{ getDivinator }}</dd>
                        <dt>Black Coat</dt>
                        <dd>{{ getBlackCoat }}</dd>
                        <dt>MacroHard</dt>
                        <dd>{{ getMacroHard }}</dd>
                    </dl>
                </div>
                
                <div class="card-pf multiline">
                    <div class="rate-title">Market</div>
                    <pf-multi-line :height="250" :data="stockData" chartType="area" :maxDisplayed="30"></pf-multi-line>
                </div>
            </div>

            <!-- operations -->
            <div class="col-md-6 block">
                <h2>Last operations</h2>
                <table class="table table-striped" v-if="auditAvailable">
                    <thead>
                    <tr>
                        <th>Action</th>
                        <th>Amount</th>
                        <th>Company</th>
                    </tr>
                    </thead>
                    <tbody id="operations">
                    <tr v-for="action in recentActions" :key="action.id">
                        <td>{{ action.type }}</td>
                        <td>{{ action.amount }}</td>
                        <td>{{ action.company }}</td>
                    </tr>
                    </tbody>
                </table>
                <h3 v-else>No Audit Service Available</h3>
            </div>
        </div>
    </div>
</template>
<script>
    import EventBus from 'vertx3-eventbus-client';
    import PortfolioService from "../libs/portfolio_service-proxy";
    import axios from 'axios';

    export default {
        name: 'Trader',
        data() {
            return {
                chartData: {
                    names: [],
                    values: {
                        'macrohard': 0,
                        'blackcoat': 0,
                        'divinator': 0
                    }
                },
                updateTaskId: 0,
                service: null,
                cash: 0,
                value: 0,
                totalValue: 0,
                eventbus: null,
                recentActions: null,
                macrohard: 0,
                blackcoat: 0,
                divinator: 0
            }
        },
        computed: {
            auditAvailable() {
                return this.recentActions !== null;
            },
            stockData() {
                let newVals = {};
                for (let [k, v] of Object.entries(this.chartData.values)) {
                    newVals[k] = parseFloat(v).toFixed(2);
                }
                return {
                    indices: [new Date()],
                    values: newVals
                }
            },
            getCash() {
                return this.cash;
            },
            getValue() {
                return this.value;
            },
            getTotalValue() {
                return this.totalValue;
            },
            getMacroHard() {
                return this.macrohard;
            },
            getBlackCoat() {
                return this.blackcoat;
            },
            getDivinator() {
                return this.divinator;
            }
        },
        filters: {
            currency(input) {
                return "$".concat(parseFloat(input).toFixed(2));
            }
        },
        methods: {
            updateTask() {
                if (this.service) {
                    this.service.getPortfolio((err, res) => {
                        if (err) {
                            console.log('Error retrieving Portfolio data via ServiceProxy');
                        } else {
                            this.cash = res.cash;
                            if (res.shares["Divinator"]) {
                                this.divinator = res.shares["Divinator"];
                            }
                            if (res.shares["Black Coat"]) {
                                this.blackcoat = res.shares["Black Coat"];
                            }
                            if (res.shares["MacroHard"]) {
                                this.macrohard = res.shares["MacroHard"];
                            }
                            
                            this.service.evaluate((err, result) => {
                                if (err) {
                                    console.log('Error calling `evaluate` on portfolio service proxy');
                                } else {
                                    this.value = result;
                                    this.totalValue = this.cash + result;
                                }
                            });
                        }
                    });
                }

                console.log('Requesting audit log.');
                // Request a list of audit events for display.
                axios.get('/operations').then((res) => {
                    if (res.message) {
                        console.log('Audit service is not returning results');
                        this.recentActions = null;
                    } else {
                        this.recentActions = res.data;
                    }
                }).catch((err) => {
                    console.log("Failed to retrieve recent actions from audit service.");
                    this.recentActions = null;
                });
            }
        },
        mounted() {
            new Promise((resolve, reject) => {
                this.eventbus = new EventBus("/eventbus");
                this.eventbus.onopen = () => resolve(true);
                this.eventbus.onerror = err => reject(err);
            }).then((_res) => {
                // When a new BID event is recieved updated the data for the associated ticker symbol
                this.eventbus.registerHandler('market', (e, m) => {
                    let name = m.body.name.replace(/ /, "").toLowerCase();
                    if (!this.chartData.names.includes(m.name)) {
                        this.chartData.names.push(m.name);
                    }
                    this.chartData.values[name] = m.body.bid;
                    this.chartData.indices = [new Date()];
                });
                this.service = new PortfolioService(this.eventbus, "service.portfolio");
            }).catch((err) => {
                console.log("Error opening eventbus: " + err.message);
            });
            this.updateTask();
            this.updateTaskId = setInterval(this.updateTask, 10000);
        },
        beforeDestroy() {
            clearInterval(this.portfolioTask);
        }
    }
</script>