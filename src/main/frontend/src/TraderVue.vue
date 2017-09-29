<style lang="scss" scoped>

</style>

<template>
    <div class="container-fluid trader">
        <div class="row">
            <!-- portfolio -->
            <div class="col-md-6">
                <div class="block">
                    <h2>Portfolio</h2>
                    <dl class="dl-horizontal">
                        <dt>Cash</dt>
                        <dd id="cash">0</dd>
                        <dt>Value</dt>
                        <dd id="value">0</dd>
                        <dt>Total Value</dt>
                        <dd id="total">0</dd>
                        <dt>Divinator Shares</dt>
                        <dd id="divinator">0</dd>
                        <dt>Black Coat Shares</dt>
                        <dd id="blackcoat">0</dd>
                        <dt>MacroHard Shares</dt>
                        <dd id="macrohard">0</dd>
                    </dl>
                </div>

                <h2>Market</h2>
                <div class="block" id="chart-block" style="margin-top: 10px">
                    <canvas id="chart" width="400" height="255"></canvas>
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
    import jq from "jquery";
    import Chart from "chart.js";
    import PortfolioService from "../libs/portfolio_service-proxy";

    let self;
    export default {
        name: 'Trader',
        data() {
          return {
              foo: null
          }
        },
        mounted() {
            self = this;
            this.service = {};
            console.log("Mounted");
            const openEventBus = new Promise((resolve, reject) => {
                this.eventbus = new EventBus("/eventbus");
                this.eventbus.onopen = () => resolve(true);
                this.eventbus.onerror = err => reject(err);
            });
            openEventBus.then(v => {
                console.log("Event bus open");
                this.eventbus.registerHandler('market', (e, m) => {
                    handleStockUpdate(m.body);
                });

                this.service = new PortfolioService(this.eventbus, "service.portfolio");
                console.log("Service", this.service);
                this.portfolioTask = setInterval(updatePortfolio, 10000);
                updatePortfolio();
            });

            // Start periodic tasks
            retrieveLastOperations();
            this.retrieveOpsTask = setInterval(retrieveLastOperations, 10000);

            createChart();
        },
        beforeMount() {
            console.log("Before mount");
        },
        beforeDestroy() {
            console.log("Before destroy");
            this.eventbus.close();
            clearInterval(this.retrieveOpsTask);
            clearInterval(this.portfolioTask);
            clearInterval(this.chartTask);
        }
    }

    const quotes = {
        "divinator": 0,
        "blackcoat": 0,
        "macrohard": 0,
        "index": 0
    };


    function handleStockUpdate(quote) {
        const price = quote.bid;
        if (quote.name === "Divinator") {
            quotes.divinator = price;
        } else if (quote.name === "Black Coat") {
            quotes.blackcoat = price;
        } else {
            quotes.macrohard = price;
        }
    }

    function retrieveLastOperations() {
        jq.get("/operations", {}, function (json) {
            const operations = jq("#operations");
            if (json.message) {
                operations.html("No audit service available");
            } else {
                operations.empty();
                jq.each(json, function (i, operation) {
                    let row = jq("<tr>");
                    let action = jq("<td>" + operation.action + "</td>");
                    let amount = jq("<td>" + operation.amount + "</td>");
                    let company = jq("<td>" + operation.quote.name + "</td>");
                    row.append(action).append(amount).append(company);
                    operations.append(row);
                });

            }
        });
    }

    function updatePortfolio() {
        if (!self.service) {
            console.log("Portfolio Service not available");
        } else {
            self.service.getPortfolio(function (err, res) {
                if (err) {
                    console.log("Error while retrieving the portfolio", err);
                } else {
                    jq("#cash").html(res.cash);
                    let divinator = res.shares["Divinator"];
                    let macrohard = res.shares["MacroHard"];
                    let blackcoat = res.shares["Black Coat"];

                    if (divinator) {
                        jq("#divinator").html(divinator);
                    } else {
                        jq("#divinator").html(0);
                    }

                    if (macrohard) {
                        jq("#macrohard").html(macrohard);
                    } else {
                        jq("#macrohard").html(0);
                    }

                    if (blackcoat) {
                        jq("#blackcoat").html(blackcoat);
                    } else {
                        jq("#blackcoat").html(0);
                    }

                    self.service.evaluate(function (err, result) {
                        if (err) {
                            console.log("Cannot evaluate portfolio", err);
                        } else {
                            jq("#value").html(result);
                            jq("#total").html(parseInt(jq("#cash").html()) + result);
                        }
                    });
                }
            })
        }
    }


    function createChart() {
        let canvas = document.getElementById('chart');
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext("2d");
        const startingData = {
            labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            datasets: [
                {
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    label: "Divinator"
                },
                {
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    fillColor: "rgba(151,187,205,0.2)",
                    strokeColor: "rgba(151,187,205,1)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    label: "Black Coat"
                },
                {
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    fillColor: "rgba(80,90,180,0.2)",
                    strokeColor: "rgba(80,90,180,1)",
                    pointColor: "rgba(80,90,180,1)",
                    pointStrokeColor: "#fff",
                    label: "MacroHard"
                }
            ]
        };

        const chart = new Chart(ctx).Line(startingData, {animationSteps: 5});
        let lastLabel = 10;

        this.chartTask = setInterval(function () {
            chart.addData([quotes.divinator, quotes.blackcoat, quotes.macrohard], ++lastLabel);
            chart.removeData();
        }, 3000);

    }
</script>