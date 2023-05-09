<?php

namespace SynchWeb\Page;

use SynchWeb\Page;
use SynchWeb\Page\Sample;
use SynchWeb\Page\Shipment;
use SynchWeb\Page\Process;



class ContainerCollective extends Page
{
    public static $arg_list = array(

        'prop' => '\w+\d+',
        // 'sample_proteins_distinct_external' => '\d',

        'shipment_containers_registry_page' => '\d+',
        'shipment_containers_registry_per_page' => '\d+',
        'shipment_containers_registry_cid' => '\d+',

        'shipment_containers_history_page' => '\d+',
        'shipment_containers_history_per_page' => '\d+',
        'shipment_containers_history_cid' => '\d+',

        'sample_cid' => '\d+',
        'sample_page' => '\d+',
        'sample_per_page' => '\d+',
        'sample_sort_by' => '\w+',

        'processing_pipelines_status' => '\w+',
        'processing_pipelines_category' => '\w+',
    );

    public static $dispatch = array(
        array('', 'get', '_get_container_data'),
    );

    function _get_container_data(){

        $response = array();

        $sample = new Sample(
                $this->app,
                $this->db,
                $this->user,
        );
        // $sample->args['external'] = $this->arg('sample_proteins_distinct_external');
        $response['sample_proteins_distinct'] = $sample->_get_disinct_proteins($this->arg('prop'));
        
        $shipment = new Shipment(
            $this->app,
            $this->db,
            $this->user,
        );
        $response['shipment_container_registry'] = $shipment->_get_container_registry(
            $this->proposalid,
            $this->arg('prop'),
            $this->arg('shipment_containers_registry_page'),
            $this->arg('shipment_containers_registry_per_page'),
            $this->arg('shipment_containers_registry_cid')
        );


        $response['shipment_container_history'] = $shipment->_get_container_history(
            $this->proposalid,
            $this->arg('prop'),
            $this->arg('shipment_containers_history_page'),
            $this->arg('shipment_containers_history_per_page'),
            $this->arg('shipment_containers_history_cid')
        );

        $sample = new Sample(
            $this->app,
            $this->db,
            $this->user,
        );

        $response['samples'] = $sample->_get_samples(
            $this->proposalid,
            $this->arg('prop'),
            $this->arg('sample_cid'),
            $this->arg('sample_page'),
            $this->arg('sample_per_page'),
            $this->arg('sample_sort_by')
        );

        $process = new Process(
            $this->app,
            $this->db,
            $this->user,
        );

        $response['process_pipelines'] = $process->_get_pipelines(
            $this->proposalid,
            $this->arg('prop'),
            $this->arg('processing_pipelines_status'),
            $this->arg('processing_pipelines_category'),
        );


        return $this->_output($response);
    }
}