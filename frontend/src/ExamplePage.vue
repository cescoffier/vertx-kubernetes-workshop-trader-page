<style lang="scss" scoped>
    .example {
        padding: 30px;
        font-size: 18px;
    }
</style>

<template>
    <div class="example">
        {{ exampleText }}
    </div>
</template>

<script>
export default {
    name: 'Example Page',
    data() {
        return {
            exampleText: ''
        }
    },
    beforeMount() {
        const updateData = () => {
            this.$http.get(window.location.pathname + '/example')
                .then(response => response.data)
                .then(data => this.exampleText = data);
        };
        updateData();
        this.updateTask = setInterval(updateData, 1000);
    },
    beforeDestroy() {
        clearInterval(this.updateTask);
    }
}
</script>