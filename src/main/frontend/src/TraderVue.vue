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
    import $ from "jquery";
    import Chart from "chart.js";
    import PortfolioService from "../libs/portfolio_service-proxy";

    export default {
        name: 'Trader',
        data() {
            
        },
        beforeMount() {

        },
        beforeDestroy() {
        }
    }

    const quotes = {
        "divinator": 0,
        "blackcoat": 0,
        "macrohard": 0,
        "index": 0
    };

    const eventbus = new EventBus('/eventbus');
    let service;
    eventbus.onopen = function () {
        eventbus.registerHandler('market', function (error, message) {
            handleStockUpdate(message.body);
        });

        service = new PortfolioService(eventbus, "service.portfolio");
        updatePortfolio();
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
        $.get("/operations", {}, function (json) {
            const operations = $("#operations");
            if (json.message) {
                operations.html("No audit service available");
            } else {
                operations.empty();
                $.each(json, function (i, operation) {
                    let row = $("<tr>");
                    let action = $("<td>" + operation.action + "</td>");
                    let amount = $("<td>" + operation.amount + "</td>");
                    let company = $("<td>" + operation.quote.name + "</td>");
                    row.append(action).append(amount).append(company);
                    operations.append(row);
                });

            }
        });
    }

    function updatePortfolio() {
        if (!service) {
            console.log("Portfolio Service not available");
        } else {
            service.getPortfolio(function (err, res) {
                if (err) {
                    console.log("Error while retrieving the portfolio", err);
                } else {
                    $("#cash").html(res.cash);
                    let divinator = res.shares["Divinator"];
                    let macrohard = res.shares["MacroHard"];
                    let blackcoat = res.shares["Black Coat"];

                    if (divinator) {
                        $("#divinator").html(divinator);
                    } else {
                        $("#divinator").html(0);
                    }

                    if (macrohard) {
                        $("#macrohard").html(macrohard);
                    } else {
                        $("#macrohard").html(0);
                    }

                    if (blackcoat) {
                        $("#blackcoat").html(blackcoat);
                    } else {
                        $("#blackcoat").html(0);
                    }

                    service.evaluate(function (err, result) {
                        if (err) {
                            console.log("Cannot evaluate portfolio", err);
                        } else {
                            $("#value").html(result);
                            $("#total").html(parseInt($("#cash").html()) + result);
                        }
                    });
                }
            })
        }
    }

    $(document).ready(function () {
        // Start periodic tasks
        retrieveLastOperations();
        setInterval(retrieveLastOperations, 5000);
        setInterval(updatePortfolio, 5000);

        createChart();
    });

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

        setInterval(function () {
            chart.addData([quotes.divinator, quotes.blackcoat, quotes.macrohard], ++lastLabel);
            chart.removeData();
        }, 3000);

    }
</script>