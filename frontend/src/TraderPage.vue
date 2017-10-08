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
                        <dd id="cash">{{ getCashValue() }}</dd>
                        <dt>Value</dt>
                        <dd id="value">{{ getValue() }}</dd>
                        <dt>Total Value</dt>
                        <dd id="total">{{ getTotalValue() }}</dd>
                        <dt v-for=""
                        <dt>Divinator Shares</dt>
                        <dd id="divinator">{{ getMacroHard() }}</dd>
                        <dt>Black Coat Shares</dt>
                        <dd id="blackcoat">{{ getBlackCoat() }}</dd>
                        <dt>MacroHard Shares</dt>
                        <dd id="macrohard">{{ getDivinator() }}</dd>
                    </dl>
                </div>

                <h2>Market</h2>
                <div class="card-pf multiline">
                    <div class="rate-title">Quotes</div>
                    <pf-multi-line :height="250" :data="stockData" chartType="area" :maxDisplayed="30"></pf-multi-line>
                </div>
            </div>

            <!-- operations -->
            <div class="col-md-6 block">
                <h2>Last operations</h2>
                <table class="table table-striped">
                    <thead>
                    <tr>
                        <th>Action</th>
                        <th>Amount</th>
                        <th>Company</th>
                    </tr>
                    </thead>
                    <tbody id="operations">
                    <!-- content added here -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import EventBus from 'vertx3-eventbus-client';
import PortfolioService from "../libs/portfolio_service-proxy";
export default {
    name: 'TraderPage',
    data () {
        return {
            chartData: {
                names: [],
                values: {
                    'macrohard': 0,
                    'blackcoat': 0,
                    'divinator': 0
                }
            },
            portfolioTask: 0,
            service: {},
            cash: 0,
            value: 0,
            totalValue: 0,
            eventbus: {}
        }
    },
    computed: {
        stockData() {
            let newVals = {};
            for (let [k ,v] of Object.entries(this.chartData.values)) {
                newVals[k] = parseFloat(v).toFixed(2);
            }
            return {
                indices: [new Date()],
                values: newVals
            }
        },
        getCash () {
            return this.cash;
        },
        getValue () {
            return this.value;
        },
        getTotalValue () {
            return this.totalValue;
        },
        getMacroHard () {
            return parseFloat(this.chartData.values.macrohard).toFixed(2);
        },
        getBlackCoat () {
            return parseFloat(this.chartData.values.blackcoat).toFixed(2);
        },
        getDivinator () {
            return parseFloat(this.chartData.values.divinator).toFixed(2);
        }
    },
    methods: {
        updatePortfolio () {
            this.service.getPortfolio((err, res) => {
               if (err) {
                   console.log('Error retrieving Portfolio data via ServiceProxy');
               } else {
                   this.chartData.values.macrohard = res.shares['MacroHard'];
                   this.chartData.values.blackcoat = res.shares['Black Coat'];
                   this.chartData.values.divinator = res.shares['Divinator'];
                   this.cash = res.cash;
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
    },
    mounted () {
        console.log("Mounted");
        new Promise((resolve, reject) => {
            this.eventbus = new EventBus("/eventbus");
            this.eventbus.onopen = () => resolve(true);
            this.eventbus.onerror = err => reject(err);
        }).then((_res) => {
            console.log("Event bus open");

            // When a new BID event is recieved updated the data for the associated ticker symbol
            this.eventbus.registerHandler('market', (e, m) => {
                let name = m.name.replace(/ /,"").toLowerCase();
                if (!this.chartData.names.includes(m.name)) {
                    this.chartData.names.push(m.name);
                }
                this.chartData.values[name] = parseFloat(m.bid).toFixed(4);
                this.chartData.indices = [new Date()];
            });
            this.service = new PortfolioService(this.eventbus, "service.portfolio");
            console.log("Service", this.service);
            this.portfolioTask = setInterval(this.updatePortfolio, 10000);
        }).catch((err) => {
            console.log("Error opening eventbus: " + err.message);
        });
    },
    beforeDestroy () {
        clearInterval(this.portfolioTask);
    }
}
</script>